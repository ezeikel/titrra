import AsyncStorage from '@react-native-async-storage/async-storage';

// A stable, anonymous device id used to key a user's data server-side until
// real accounts land (mirrors chunky-crayon's anonymous-first device flow).
// Generated once, then persisted in AsyncStorage for the life of the install.

const STORAGE_KEY = 'titrra.deviceId';

// RFC-4122-ish v4 uuid. We avoid a crypto dependency for v1; this id only keys
// anonymous local data, it is not a security token.
const generateId = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

let cached: string | null = null;

export const getDeviceId = async (): Promise<string> => {
  if (cached) return cached;

  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  if (existing) {
    cached = existing;
    return existing;
  }

  const fresh = generateId();
  await AsyncStorage.setItem(STORAGE_KEY, fresh);
  cached = fresh;
  return fresh;
};
