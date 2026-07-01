// Sentry init for the worker. MUST be imported before any other module in
// index.ts — @sentry/node patches the runtime on init (HTTP, fs, etc.), so
// anything imported earlier won't be traced. No-op when SENTRY_DSN is unset
// (local dev), so the worker runs fine without error reporting.
import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    initialScope: { tags: { service: 'titrra-worker' } },
  });
}

export { Sentry };
