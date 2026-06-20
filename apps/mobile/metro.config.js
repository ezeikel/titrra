const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

const config = getSentryExpoConfig(__dirname);

// ── react-native-screens/experimental resolver shim ──────────────────────────
// expo-router's experimental-stack pulls `react-native-screens/experimental`
// into its module graph even when only the standard <Stack> is used. With
// Metro's `unstable_enablePackageExports: true` (the Expo SDK 56 default),
// subpaths resolve via a package's `exports` map — but react-native-screens
// 4.25.2 ships NO `exports` field, so Metro reports "could not be found" and
// redboxes every screen. Map the one subpath to its real source entry and
// delegate everything else to the default resolver. (Same shim as
// go-unbeaten / chunky-crayon-mobile; remove when rn-screens gains an
// `exports` map.)
const RN_SCREENS_EXPERIMENTAL = path.join(
  path.dirname(require.resolve('react-native-screens/package.json')),
  'src/experimental/index.ts',
);
const baseResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-screens/experimental') {
    return { type: 'sourceFile', filePath: RN_SCREENS_EXPERIMENTAL };
  }
  const next = baseResolveRequest ?? context.resolveRequest;
  return next(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
