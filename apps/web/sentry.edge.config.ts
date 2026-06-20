// This file configures the initialization of Sentry for edge features
// (middleware, edge routes, and so on).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.2,

  enableLogs: true,

  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Privacy policy promises no PII in error reports.
  sendDefaultPii: false,
});
