import { ConfigContext, ExpoConfig } from 'expo/config';
import { existsSync } from 'fs';
import { join } from 'path';
import pkg from './package.json';

// Per-variant app identity (same pattern as go-unbeaten / chunky-crayon / PTP).
// EXPO_PUBLIC_ENVIRONMENT is set per EAS build profile (eas.json) so
// dev / preview / prod produce DIFFERENT bundle ids + names + icons and can
// all install side-by-side on one device.
const env = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';

const appName =
  env === 'production'
    ? 'Titrra'
    : env === 'preview'
      ? 'Titrra Internal'
      : 'Titrra Dev';

const bundleId =
  env === 'production'
    ? 'com.chewybytes.titrra.app'
    : env === 'preview'
      ? 'com.chewybytes.titrra.app.internal'
      : 'com.chewybytes.titrra.app.dev';

// Allow cleartext (http://) traffic in dev + preview ONLY, so on-device testing
// can hit a local (localhost / LAN IP) or staging API. Production stays
// https-only (Android default) — never ship cleartext in the store build.
const allowCleartext = env !== 'production';

// Minted by `eas init` under the chewybytes org (@chewybytes/titrra). Not
// secret — it must be present in every build, so it's a hardcoded default with
// an env override (matches go-unbeaten's pattern).
const EAS_PROJECT_ID =
  process.env.EAS_PROJECT_ID ?? 'be088d33-0a70-4a53-8db0-ea198201c3b1';

export default ({ config }: ConfigContext): ExpoConfig => {
  // Per-variant icons if present, else fall back to the prod icon.
  const variantSuffix =
    env === 'production' ? '' : env === 'preview' ? '-preview' : '-dev';
  const pickIcon = (base: string): string => {
    const variantPath = `./assets/images/${base}${variantSuffix}.png`;
    return existsSync(join(__dirname, variantPath))
      ? variantPath
      : `./assets/images/${base}.png`;
  };

  return {
    ...config,
    name: appName,
    slug: 'titrra',
    owner: 'chewybytes',
    version: pkg.version,
    orientation: 'portrait',
    icon: pickIcon('icon'),
    scheme: 'titrra',
    userInterfaceStyle: 'light',
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/icon.png',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: bundleId,
      // Universal links so shared titrra.com URLs open the app when installed
      // (AASA file ships on the web app).
      associatedDomains: ['applinks:titrra.com'],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      // Required by App Store review (iOS 17.2+) because we bundle a tracking
      // SDK (PostHog) and touch the listed APIs. Mirrors ptp's manifest, scoped
      // to what Titrra actually uses.
      privacyManifests: {
        NSPrivacyTracking: false,
        NSPrivacyTrackingDomains: [],
        NSPrivacyCollectedDataTypes: [],
        NSPrivacyAccessedAPITypes: [
          {
            // AsyncStorage → UserDefaults.
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
          {
            // File timestamps (Expo file system / caches).
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategoryFileTimestamp',
            NSPrivacyAccessedAPITypeReasons: ['C617.1'],
          },
          {
            // Disk space checks.
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
            NSPrivacyAccessedAPITypeReasons: ['E174.1'],
          },
          {
            // System boot time (used by analytics/crash SDKs).
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategorySystemBootTime',
            NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
          },
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: pickIcon('adaptive-icon'),
        backgroundColor: '#0d9488',
      },
      package: bundleId,
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: 'titrra.com', pathPrefix: '/' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: [{ scheme: 'titrra' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#0d9488',
        },
      ],
      'expo-notifications',
      // Dev launcher must NEVER ship in a non-dev build: in a release binary
      // with no Metro server it throws at startup, which expo-updates'
      // ErrorRecovery then re-raises as an opaque SIGABRT (crash-on-open).
      // Only the `development` variant gets it.
      ...(env === 'development' ? (['expo-dev-client'] as const) : []),
      [
        'expo-font',
        {
          fonts: [
            './assets/fonts/Inter-Regular.ttf',
            './assets/fonts/Inter-Medium.ttf',
            './assets/fonts/Inter-SemiBold.ttf',
            './assets/fonts/Inter-Bold.ttf',
            './assets/fonts/GeistMono-Regular.ttf',
          ],
        },
      ],
      [
        '@sentry/react-native/expo',
        {
          url: 'https://sentry.io/',
          project: 'titrra-app',
          organization: 'chewybytes',
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '16.4',
          },
          android: {
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            buildToolsVersion: '36.0.0',
            // dev/preview only — see allowCleartext above. Lets a local/LAN/
            // staging http:// API be reached on-device; prod stays https-only.
            usesCleartextTraffic: allowCleartext,
          },
        },
      ],
    ],
    experiments: { typedRoutes: true },
    runtimeVersion: { policy: 'appVersion' },
    updates: {
      url: EAS_PROJECT_ID ? `https://u.expo.dev/${EAS_PROJECT_ID}` : undefined,
      // OTA stays ON for post-launch updates, but we DON'T auto-check during the
      // fragile cold-start window (see lib/updates + the NEVER policy below).
      checkAutomatically: 'NEVER',
      fallbackToCacheTimeout: 0,
    },
    extra: {
      ...config.extra,
      eas: {
        ...(config.extra?.eas ?? {}),
        ...(EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : {}),
      },
    },
  };
};
