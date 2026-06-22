// Allow importing bundled .glb 3D models (Metro resolves these to an asset id
// that expo-asset turns into a local URI). See metro.config.js assetExts.
declare module '*.glb' {
  const asset: number;
  export default asset;
}
