import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform } from 'react-native';
import {
  registerDevice,
  sendMagicLink as sendMagicLinkApi,
  signInWithApple as signInWithAppleApi,
  signInWithFacebook as signInWithFacebookApi,
  signInWithGoogle as signInWithGoogleApi,
} from '@/lib/api';
import {
  clearSession,
  getSessionToken,
  setSessionToken,
  setStoredUserId,
} from '@/lib/auth';
import { getDeviceId } from '@/lib/device';

// Anonymous-first + optional account linking (same model as chunky-crayon / ptp).
// On boot the device registers to get a signed token anchored to an anonymous DB
// user. Signing in with an email links/merges that anonymous user onto a real
// account so data syncs across devices + web. Sign-in is never a gate.

export type SignInResult =
  | { ok: true }
  | { ok: false; cancelled: boolean; error?: string };

type AuthContextValue = {
  /** True once the device has a session token from a real (email) account. */
  isSignedIn: boolean;
  /** DB User.id for this device (anonymous or linked). */
  userId: string | null;
  signInWithGoogle: () => Promise<SignInResult>;
  signInWithApple: () => Promise<SignInResult>;
  signInWithFacebook: () => Promise<SignInResult>;
  sendMagicLink: (email: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  isSignedIn: false,
  userId: null,
  signInWithGoogle: async () => ({ ok: false, cancelled: false }),
  signInWithApple: async () => ({ ok: false, cancelled: false }),
  signInWithFacebook: async () => ({ ok: false, cancelled: false }),
  sendMagicLink: async () => ({ ok: false, cancelled: false }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

type NativeAuthModules = {
  GoogleSignin: {
    configure: (config: { webClientId?: string; iosClientId?: string }) => void;
    hasPlayServices: () => Promise<void>;
    signIn: () => Promise<{ data?: { idToken?: string | null } }>;
    signOut: () => Promise<void>;
  };
  AppleAuthentication: {
    AppleAuthenticationScope: { EMAIL: number; FULL_NAME: number };
    signInAsync: (options: { requestedScopes: number[] }) => Promise<{
      identityToken?: string | null;
      fullName?: { givenName?: string | null; familyName?: string | null };
    }>;
  };
  AccessToken: {
    getCurrentAccessToken: () => Promise<{ accessToken?: string } | null>;
  };
  LoginManager: {
    logInWithPermissions: (
      permissions: string[],
    ) => Promise<{ isCancelled: boolean }>;
    logOut: () => void;
  };
};

let cachedNativeAuth: NativeAuthModules | null | undefined;

// These packages contain native components (fbsdk's FBLoginButton calls
// requireNativeComponent at module scope, which react-native-web doesn't
// provide). Metro may bundle the require calls for web, but never evaluates
// them while static-rendering the Expo web build. That keeps the native app's
// OAuth flows intact without making web export execute a
// requireNativeComponent call. (Same fix as salt-mammal.)
const getNativeAuth = (): NativeAuthModules | null => {
  if (cachedNativeAuth !== undefined) return cachedNativeAuth;
  if (Platform.OS === 'web') {
    cachedNativeAuth = null;
    return cachedNativeAuth;
  }

  const { GoogleSignin } = require('@react-native-google-signin/google-signin');
  const AppleAuthentication = require('expo-apple-authentication');
  const { AccessToken, LoginManager } = require('react-native-fbsdk-next');
  cachedNativeAuth = {
    GoogleSignin,
    AppleAuthentication,
    AccessToken,
    LoginManager,
  };
  return cachedNativeAuth;
};

const isCancel = (err: unknown): boolean => {
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message?: unknown }).message)
      : '';
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';
  return (
    /cancel/i.test(msg) ||
    code === 'ERR_REQUEST_CANCELED' ||
    code === '-5' /* google SIGN_IN_CANCELLED */
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isSignedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Configure Google Sign-In once. webClientId is the audience the backend
  // verifies the idToken against; iosClientId drives the native iOS flow.
  useEffect(() => {
    const native = getNativeAuth();
    if (native && process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      native.GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      });
    }
  }, []);

  // Register the device on boot so a DB user id + token exist before the paywall
  // / RevenueCat anchor on it. If a token already exists (signed in), keep it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await getSessionToken();
        const deviceId = await getDeviceId();
        if (existing) {
          if (!cancelled) setSignedIn(true);
          return;
        }
        const { userId: uid, token } = await registerDevice(deviceId);
        if (cancelled) return;
        await setSessionToken(token);
        await setStoredUserId(uid);
        setUserId(uid);
      } catch {
        // Offline / backend unreachable — the app still works anonymously via
        // the device header; we just don't have a signed token yet.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist a successful sign-in result (token → keychain, update state).
  const applyAuth = useCallback(
    async (r: { userId: string; token: string }) => {
      await setSessionToken(r.token);
      await setStoredUserId(r.userId);
      setUserId(r.userId);
      setSignedIn(true);
    },
    [],
  );

  const signInWithGoogle = useCallback(async (): Promise<SignInResult> => {
    const native = getNativeAuth();
    if (!native) {
      return { ok: false, cancelled: false, error: 'native auth unavailable' };
    }
    try {
      await native.GoogleSignin.hasPlayServices();
      const info = await native.GoogleSignin.signIn();
      const idToken = info.data?.idToken;
      if (!idToken)
        return { ok: false, cancelled: false, error: 'no id token' };
      const deviceId = await getDeviceId();
      await applyAuth(await signInWithGoogleApi(deviceId, idToken));
      return { ok: true };
    } catch (err) {
      return { ok: false, cancelled: isCancel(err) };
    }
  }, [applyAuth]);

  const signInWithApple = useCallback(async (): Promise<SignInResult> => {
    const native = getNativeAuth();
    if (!native) {
      return { ok: false, cancelled: false, error: 'native auth unavailable' };
    }
    try {
      const cred = await native.AppleAuthentication.signInAsync({
        requestedScopes: [
          native.AppleAuthentication.AppleAuthenticationScope.EMAIL,
          native.AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });
      if (!cred.identityToken) {
        return { ok: false, cancelled: false, error: 'no identity token' };
      }
      // Apple returns the name only on the FIRST authorization; forward it when
      // present, else the server keeps whatever it stored.
      const name = [cred.fullName?.givenName, cred.fullName?.familyName]
        .filter(Boolean)
        .join(' ');
      const deviceId = await getDeviceId();
      await applyAuth(
        await signInWithAppleApi(
          deviceId,
          cred.identityToken,
          name || undefined,
        ),
      );
      return { ok: true };
    } catch (err) {
      return { ok: false, cancelled: isCancel(err) };
    }
  }, [applyAuth]);

  const signInWithFacebook = useCallback(async (): Promise<SignInResult> => {
    const native = getNativeAuth();
    if (!native) {
      return { ok: false, cancelled: false, error: 'native auth unavailable' };
    }
    try {
      const result = await native.LoginManager.logInWithPermissions([
        'public_profile',
        'email',
      ]);
      if (result.isCancelled) return { ok: false, cancelled: true };
      const token = await native.AccessToken.getCurrentAccessToken();
      if (!token?.accessToken) {
        return { ok: false, cancelled: false, error: 'no access token' };
      }
      const deviceId = await getDeviceId();
      await applyAuth(await signInWithFacebookApi(deviceId, token.accessToken));
      return { ok: true };
    } catch (err) {
      return { ok: false, cancelled: isCancel(err) };
    }
  }, [applyAuth]);

  const sendMagicLink = useCallback(
    async (email: string): Promise<SignInResult> => {
      try {
        const deviceId = await getDeviceId();
        await sendMagicLinkApi(deviceId, email);
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          cancelled: false,
          error: err instanceof Error ? err.message : 'send failed',
        };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    const native = getNativeAuth();
    try {
      await native?.GoogleSignin.signOut();
    } catch {
      // not signed in with Google — ignore
    }
    try {
      native?.LoginManager.logOut();
    } catch {
      // fbsdk may not be initialised — ignore
    }
    await clearSession();
    setSignedIn(false);
    // Re-register so the device drops back to a fresh anonymous identity.
    try {
      const deviceId = await getDeviceId();
      const { userId: uid, token } = await registerDevice(deviceId);
      await setSessionToken(token);
      await setStoredUserId(uid);
      setUserId(uid);
    } catch {
      // offline — fine, device header still identifies anonymously
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isSignedIn,
        userId,
        signInWithGoogle,
        signInWithApple,
        signInWithFacebook,
        sendMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
