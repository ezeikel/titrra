const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

const config = getSentryExpoConfig(__dirname);

// Bundle .glb 3D models as assets (the injection-site body map's human model).
config.resolver.assetExts.push('glb');

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

  // ── react-native-wgpu (WebGPU/Metal) + three.js WebGPU build ───────────────
  // The 3D injection-site body map renders through react-native-wgpu (Dawn →
  // Metal) because expo-gl's OpenGL ES backend produces NO pixels on the
  // Apple-Silicon iOS simulator (an Apple platform bug). For this to work:
  //   1) all `three` imports must resolve to three's WebGPU build, and
  //   2) `@react-three/fiber` must resolve to its standard (web/module) build,
  //      NOT the `/native` (expo-gl) entry — the wgpu Canvas drives R3F itself.
  // (Pattern from Expo's official `with-webgpu` template metro.config.js.)
  if (moduleName === 'three') {
    return context.resolveRequest(context, 'three/webgpu', platform);
  }
  if (platform !== 'web' && moduleName.startsWith('@react-three/fiber')) {
    return context.resolveRequest(
      {
        ...context,
        unstable_conditionNames: ['module'],
        mainFields: ['module'],
      },
      moduleName,
      platform,
    );
  }

  const next = baseResolveRequest ?? context.resolveRequest;
  return next(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
