// @ts-ignore
/// <reference types="react-native-css/types" />

// NativeWind 5 (react-native-css) ships className typings but no ambient
// declaration for the global stylesheet side-effect import. Metro/Babel
// transforms `import './global.css'` at build time; TS just needs to know it
// resolves to a module.
declare module '*.css' {}
