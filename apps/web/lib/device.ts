'use client';

// Anonymous-first device identity for the web app, mirroring the mobile flow
// (apps/mobile/lib/device.ts). A stable id is generated once and stored in a
// cookie so the browser "remembers" the user across visits. It is sent to the
// API as the `x-titrra-device` header, where the server upserts a `device:<id>`
// User. NextAuth / Google sign-in is a planned future upgrade; until then this
// cookie IS the account.

const COOKIE_KEY = 'titrra.deviceId';
// ~10 years — effectively "remember until cleared".
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;

// RFC-4122-ish v4 uuid. Matches mobile: not a security token, just a stable key
// for anonymous local data.
const generateId = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const readCookie = (key: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${key}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
};

const writeCookie = (key: string, value: string, maxAge: number) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${key}=${encodeURIComponent(
    value,
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

let cached: string | null = null;

// Get the device id, generating + persisting one on first call. Safe to call
// repeatedly (memoised). Client-only.
export const getDeviceId = (): string => {
  if (cached) return cached;
  const existing = readCookie(COOKIE_KEY);
  if (existing) {
    cached = existing;
    return existing;
  }
  const fresh = generateId();
  writeCookie(COOKIE_KEY, fresh, COOKIE_MAX_AGE);
  cached = fresh;
  return fresh;
};

// "Clear user / cookies" — wipe the device cookie so the next load starts a
// brand-new anonymous user. The caller should reload afterwards.
export const clearDevice = (): void => {
  cached = null;
  if (typeof document !== 'undefined') {
    document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }
};
