import type { AnalyticsEvent, AnalyticsProperties } from '@titrra/types';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';

export type { AnalyticsEvent } from '@titrra/types';

const API_KEY =
  process.env.EXPO_PUBLIC_POSTHOG_KEY ??
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const APP_ENVIRONMENT = process.env.EXPO_PUBLIC_ENVIRONMENT ?? 'development';

// Same EU instance as the web app — shared event vocabulary lives in
// @titrra/types so cross-platform funnels line up. Null when no key is
// configured (local dev) so capture calls are safe no-ops.
export const posthog = API_KEY
  ? new PostHog(API_KEY, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    })
  : null;

const getBaseProperties = (): AnalyticsProperties => ({
  platform: Platform.OS,
  environment: APP_ENVIRONMENT,
  app_version:
    Constants.expoConfig?.version ??
    Application.nativeApplicationVersion ??
    null,
  build_number: Application.nativeBuildVersion ?? null,
});

export const trackEvent = (
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
) => {
  if (!posthog) return;
  // PostHog's capture rejects `undefined` property values; drop them so the
  // loose AnalyticsProperties shape stays ergonomic at call sites.
  const merged = { ...getBaseProperties(), ...properties };
  const clean: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined) clean[key] = value;
  }
  posthog.capture(event, clean);
};
