'use client';

import type { InjectionSite } from '@titrra/types';
import { useSyncExternalStore } from 'react';

// Web counterpart of apps/mobile/lib/body-shape.ts — which mannequin to show on
// the 3D injection-site map, framed as a neutral visual preference. The model
// assets are served from /public/models; landmarks are fetched alongside.

export type BodyShape = 'MALE' | 'FEMALE' | 'UNSPECIFIED';

export type BodyModel = {
  // Public URL of the baked static GLB.
  url: string;
  // Public URL of its precomputed injection-site landmarks JSON.
  landmarksUrl: string;
};

const MALE: BodyModel = {
  url: '/models/mannequin-static.glb',
  landmarksUrl: '/models/mannequin-static-landmarks.json',
};
const FEMALE: BodyModel = {
  url: '/models/female-static.glb',
  landmarksUrl: '/models/female-static-landmarks.json',
};

// UNSPECIFIED falls back to the original (male) mannequin — the neutral default
// art, presented without a gender label.
export const BODY_MODELS: Record<BodyShape, BodyModel> = {
  MALE,
  FEMALE,
  UNSPECIFIED: MALE,
};

export const bodyModelFor = (shape: BodyShape): BodyModel =>
  BODY_MODELS[shape] ?? MALE;

export type Landmarks = Record<InjectionSite, [number, number, number]>;

// ─── Local persistence + shared store ───────────────────────────────────────
const STORAGE_KEY = 'titrra.bodyShape';

const readStored = (): BodyShape => {
  if (typeof localStorage === 'undefined') return 'UNSPECIFIED';
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'MALE' || v === 'FEMALE' ? v : 'UNSPECIFIED';
};

let current: BodyShape = 'UNSPECIFIED';
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => {
  for (const l of listeners) l();
};

const hydrate = () => {
  if (hydrated) return;
  hydrated = true;
  const stored = readStored();
  if (stored !== current) {
    current = stored;
    emit();
  }
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  hydrate();
  return () => listeners.delete(cb);
};

export const setStoredBodyShape = (shape: BodyShape): void => {
  hydrated = true;
  if (shape !== current) {
    current = shape;
    emit();
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, shape);
  }
};

// Reactive hook backed by the shared store so the Settings toggle and the live
// 3D map stay in sync. SSR returns the neutral default; the client hydrates.
export const useBodyShape = (): {
  bodyShape: BodyShape;
  setBodyShape: (s: BodyShape) => void;
} => {
  const bodyShape = useSyncExternalStore(
    subscribe,
    () => current,
    () => 'UNSPECIFIED' as BodyShape,
  );
  return { bodyShape, setBodyShape: setStoredBodyShape };
};
