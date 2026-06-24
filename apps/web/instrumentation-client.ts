import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host:
      process.env.NODE_ENV === 'production'
        ? '/ingest'
        : process.env.NEXT_PUBLIC_POSTHOG_HOST,
    ui_host: 'https://eu.posthog.com',
    // Enables automatic SPA pageview/pageleave capture — no manual $pageview.
    defaults: '2025-05-24',
    // Cookieless until the user grants analytics consent.
    persistence: 'memory',
    debug: process.env.NODE_ENV === 'development',
  });

  // Session-start event, parity with mobile (which fires app_opened on launch
  // in app/_layout.tsx). This module runs once per full page load (not per SPA
  // navigation), so it's the right place for a once-per-session signal.
  posthog.capture('app_opened', { platform: 'web' });
}

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.2,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
