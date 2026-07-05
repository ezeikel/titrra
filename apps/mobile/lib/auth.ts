import * as SecureStore from 'expo-secure-store';

// Mobile auth token storage (adapted from parking-ticket-pal). The signed device
// JWT + the DB user id live in the keychain (SecureStore). The device id itself
// stays in lib/device.ts (AsyncStorage) — it's not a secret and the anonymous
// data plumbing already reads it. logout() clears the token but KEEPS the device
// id so the user drops back to their anonymous local identity.

const SESSION_TOKEN_KEY = 'titrra.sessionToken';
const USER_ID_KEY = 'titrra.userId';

export const getSessionToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(SESSION_TOKEN_KEY);

export const setSessionToken = (token: string): Promise<void> =>
  SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);

export const getStoredUserId = (): Promise<string | null> =>
  SecureStore.getItemAsync(USER_ID_KEY);

export const setStoredUserId = (userId: string): Promise<void> =>
  SecureStore.setItemAsync(USER_ID_KEY, userId);

/** Bearer header for API calls, or null when anonymous (device-only). */
export const getAuthHeader = async (): Promise<string | null> => {
  const token = await getSessionToken();
  return token ? `Bearer ${token}` : null;
};

/** True once the device has a session token (i.e. signed into an account). */
export const isSignedIn = async (): Promise<boolean> =>
  !!(await getSessionToken());

/** Clear the account session; keep the anonymous device id so data persists. */
export const clearSession = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
};
