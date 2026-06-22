// Single source of truth for the app's motion feel — so the stepper, paywall,
// carousel and progress dots all animate consistently (the house spring/timing
// language). Reanimated 4.

export const SPRING_BOUNCE = { damping: 6, stiffness: 320 }; // press / pop
export const SPRING_SETTLE = { damping: 12, stiffness: 260 }; // resolve after bounce
export const SPRING_ENTRY = { damping: 11, stiffness: 120 }; // card / hero entrance

export const TIMING_DOT = { duration: 220 }; // ProgressDots width / opacity
export const TIMING_FADE = { duration: 600 }; // slide visual / text fade-in
export const TIMING_RISE = { duration: 420 }; // paywall body fade + rise
