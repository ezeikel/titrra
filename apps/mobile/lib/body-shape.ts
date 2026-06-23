import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import femaleLandmarks from '@/assets/models/female-static-landmarks.json';
import maleLandmarks from '@/assets/models/mannequin-static-landmarks.json';
import type { InjectionSite } from '@/lib/rotation';

// Which body figure the 3D injection-site map shows. Mirrors the Prisma
// `BodyShape` enum. Framed to the user as a neutral visual preference ("body
// shape" / "which body would you like to see?"), never a clinical or identity
// field. UNSPECIFIED = the neutral default; we render the male mannequin for it
// (the original art) but never *label* it male — it's just "the default body".
export type BodyShape = 'MALE' | 'FEMALE' | 'UNSPECIFIED';

// A baked mannequin: the static GLB + its precomputed injection-site landmarks
// (both produced by scripts/bake-mannequin.mjs, so any humanoid model drops in
// with no hand-tuned coordinates). Adding a new figure is one registry entry.
export type BodyModel = {
  glb: number; // require()'d asset module id
  landmarks: Record<InjectionSite, [number, number, number]>;
};

// require() of a bundled .glb returns the Metro asset module id (a number).
const maleGlb = require('@/assets/models/mannequin-static.glb') as number;
const femaleGlb = require('@/assets/models/female-static.glb') as number;

const MALE: BodyModel = {
  glb: maleGlb,
  landmarks: maleLandmarks as BodyModel['landmarks'],
};
const FEMALE: BodyModel = {
  glb: femaleGlb,
  landmarks: femaleLandmarks as BodyModel['landmarks'],
};

// UNSPECIFIED falls back to the original (male) mannequin — it's the neutral
// default art, presented without a gender label.
export const BODY_MODELS: Record<BodyShape, BodyModel> = {
  MALE,
  FEMALE,
  UNSPECIFIED: MALE,
};

export const bodyModelFor = (shape: BodyShape): BodyModel =>
  BODY_MODELS[shape] ?? MALE;

// ─── Local persistence ──────────────────────────────────────────────────────
// The preference is read on the Today screen before any network, so it lives in
// AsyncStorage (mirrored to the server via onboarding for cross-device later).
const BODY_SHAPE_KEY = 'titrra.bodyShape';

export const getStoredBodyShape = async (): Promise<BodyShape> => {
  const v = await AsyncStorage.getItem(BODY_SHAPE_KEY);
  return v === 'MALE' || v === 'FEMALE' ? v : 'UNSPECIFIED';
};

// ─── Shared in-memory store ─────────────────────────────────────────────────
// A single module-level store so EVERY screen (the Today map + the Settings
// toggle) reads the same value and updates together — changing the shape in
// Settings must re-render the live 3D map even though both screens stay mounted
// (Expo Router keeps tabs alive). Hydrated once from AsyncStorage on first read.
let current: BodyShape = 'UNSPECIFIED';
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => {
  for (const l of listeners) l();
};

const hydrate = () => {
  if (hydrated) return;
  hydrated = true;
  getStoredBodyShape().then((s) => {
    if (s !== current) {
      current = s;
      emit();
    }
  });
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  hydrate();
  return () => listeners.delete(cb);
};

export const setStoredBodyShape = async (shape: BodyShape): Promise<void> => {
  hydrated = true; // an explicit set is authoritative; skip a racing hydrate
  if (shape !== current) {
    current = shape;
    emit();
  }
  await AsyncStorage.setItem(BODY_SHAPE_KEY, shape);
};

// Reactive hook backed by the shared store. Returns the current shape + a setter
// that persists and notifies all consumers. Used by the Settings toggle and
// read by BodyMap3D. `loading` is true until the stored value hydrates.
export const useBodyShape = (): {
  bodyShape: BodyShape;
  setBodyShape: (s: BodyShape) => void;
  loading: boolean;
} => {
  const bodyShape = useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );

  const setBodyShape = (s: BodyShape) => {
    void setStoredBodyShape(s);
  };

  return { bodyShape, setBodyShape, loading: !hydrated };
};
