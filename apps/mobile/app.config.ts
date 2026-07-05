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

// --- Auth: native OAuth URL schemes (same pattern as ptp / chunky-crayon) ---
// iOS Google Sign-In needs the REVERSED iOS client id as a URL scheme in
// CFBundleURLTypes, or the native flow never returns. Facebook needs `fb<APPID>`.
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
  ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.split('.').reverse().join('.')
  : '';
const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '';
const facebookClientToken = process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN ?? '';

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
      // Sign in with Apple (native flow via expo-apple-authentication).
      usesAppleSignIn: true,
      // Universal links so shared titrra.com URLs open the app when installed
      // (AASA file ships on the web app).
      associatedDomains: ['applinks:titrra.com'],
      entitlements: {
        'com.apple.developer.applesignin': ['Default'],
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // Native OAuth return URL schemes: reversed Google iOS client id +
        // fb<APPID>. Without these the iOS Google / Facebook flows never
        // redirect back into the app.
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              ...(googleIosClientId ? [googleIosClientId] : []),
              ...(facebookAppId ? [`fb${facebookAppId}`] : []),
            ],
          },
        ],
        ...(facebookAppId
          ? {
              FacebookAppID: facebookAppId,
              FacebookClientToken: facebookClientToken,
              FacebookDisplayName: appName,
              // Lets the app open the FB app for login if installed.
              LSApplicationQueriesSchemes: [
                'fbapi',
                'fb-messenger-api',
                'fbauth2',
                'fbshareextension',
              ],
            }
          : {}),
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
        // Match the icon artwork's baked-in background (#0499a3), not the old
        // #0d9488 — otherwise the adaptive-icon edge / splash tile mismatches.
        backgroundColor: '#0499a3',
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
      // R3F's native entrypoint imports expo-asset (GL asset pipeline).
      'expo-asset',
      // --- Auth ---
      'expo-secure-store',
      'expo-apple-authentication',
      '@react-native-google-signin/google-signin',
      // Podfile patch: google-signin → AppCheckCore needs GoogleUtilities +
      // RecaptchaInterop as modular headers under Expo SDK 56 static frameworks,
      // or `pod install` fails. (Same fix chunky-crayon uses.)
      './plugins/withModularHeaders',
      // Facebook native SDK. `scheme` MUST be fb<APPID> (NOT the app deep-link
      // scheme) — a wrong scheme is why FB login broke on Android in ptp. Only
      // added when the FB env is present.
      ...(facebookAppId
        ? [
            [
              'react-native-fbsdk-next',
              {
                appID: facebookAppId,
                clientToken: facebookClientToken,
                displayName: appName,
                scheme: `fb${facebookAppId}`,
              },
            ] as [string, Record<string, string>],
          ]
        : []),
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          // Match the icon artwork's baked-in background so the splash tile
          // blends into the screen instead of showing a colour seam.
          backgroundColor: '#0499a3',
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
            // Body / UI
            './assets/fonts/Inter-Regular.ttf',
            './assets/fonts/Inter-Medium.ttf',
            './assets/fonts/Inter-SemiBold.ttf',
            './assets/fonts/Inter-Bold.ttf',
            // Display — Bricolage Grotesque (editorial, premium-health). Used
            // for headings + big numeric stats. See docs/DESIGN-SYSTEM.md.
            './assets/fonts/BricolageGrotesque-Medium.ttf',
            './assets/fonts/BricolageGrotesque-SemiBold.ttf',
            './assets/fonts/BricolageGrotesque-Bold.ttf',
            './assets/fonts/BricolageGrotesque-ExtraBold.ttf',
            // Tabular numerals
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
            // react-native-webgpu (3D body map) calls AHardwareBuffer_* APIs
            // that are only available on API 26+. The default minSdk (24) makes
            // the NDK mark them unavailable and the native build fails. WebGPU
            // on Android requires 26 anyway, so pin it here.
            minSdkVersion: 26,
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            buildToolsVersion: '36.0.0',
            // dev/preview only — see allowCleartext above. Lets a local/LAN/
            // staging http:// API be reached on-device; prod stays https-only.
            usesCleartextTraffic: allowCleartext,
          },
        },
      ],
      // Local StoreKit testing for `expo run:ios`: copies the .storekit into
      // ios/ and wires it into the generated scheme's Run action so RevenueCat
      // resolves the `default` offering (monthly/yearly/lifetime) IN THE
      // SIMULATOR with no App Store Connect / no uploaded RC Apple creds.
      // Re-runs on every prebuild (survives `expo prebuild --clean`).
      // NON-PRODUCTION ONLY: dev + preview run on simulators; production
      // (TestFlight/store) uses real ASC and must NEVER ship a test config.
      ...(env !== 'production'
        ? [
            [
              './plugins/withStoreKitConfig',
              { relativePath: 'ios-config/Titrra.storekit' },
            ] as [string, { relativePath: string }],
          ]
        : []),
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
