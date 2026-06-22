// react-native-wgpu ships type declarations under lib/typescript/ but its
// package.json has no `types` field, so TS can't find them automatically.
// Re-export the real declarations from here so imports are typed.
declare module 'react-native-wgpu' {
  export * from 'react-native-wgpu/lib/typescript/webgpu/src/index';
}
