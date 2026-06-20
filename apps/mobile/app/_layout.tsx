import '../global.css';
import * as Sentry from '@sentry/react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { type ErrorBoundaryProps, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Toaster } from 'sonner-native';
import { trackEvent } from '@/lib/analytics';
import Providers from '@/providers';

// release/dist must match the source maps uploaded at build time so crashes
// symbolicate. version+build is stable per binary; dist = native build number.
const SENTRY_RELEASE = `${Constants.expoConfig?.version ?? '0.0.0'}+${
  Application.nativeBuildVersion ?? '0'
}`;

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  // OFF in local dev (Metro HMR noise), ON for preview/production builds.
  enabled: !__DEV__ && Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN),
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT ?? 'development',
  release: SENTRY_RELEASE,
  dist: String(Application.nativeBuildVersion ?? '0'),
  tracesSampleRate: 1.0,
  sendDefaultPii: false,
});

const RootLayout = () => {
  useEffect(() => {
    trackEvent('app_opened');
  }, []);

  return (
    <Providers>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#ffffff' },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="paywall"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
      <Toaster position="top-center" />
    </Providers>
  );
};

// Expo Router renders this for any uncaught render error in the app tree.
// Without it a first-render throw is swallowed and the splash hangs forever.
export const ErrorBoundary = ({ error, retry }: ErrorBoundaryProps) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#ffffff',
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#0e1a1a' }}>
        Something went wrong
      </Text>
      <Text style={{ marginTop: 8, textAlign: 'center', color: '#5a6b69' }}>
        Titrra hit an unexpected error on startup. Please try again.
      </Text>
      <Pressable
        onPress={retry}
        style={{
          marginTop: 24,
          backgroundColor: '#0d9488',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: '#ffffff', fontWeight: '700' }}>Try again</Text>
      </Pressable>
    </View>
  );
};

export default Sentry.wrap(RootLayout);
