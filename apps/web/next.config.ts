import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cache Components (PPR): pages are static by default; per-request data must
  // sit behind a Suspense boundary (connection()/searchParams) and cached data
  // uses the 'use cache' directive + cacheLife/cacheTag.
  cacheComponents: true,
  // posthog-js calls /ingest/e/ with a trailing slash — without this every
  // analytics request pays a 308 redirect before reaching the proxy.
  skipTrailingSlashRedirect: true,
  // Shared packages ship as TypeScript source (also consumed by the Expo app
  // via Metro) — Next compiles them as part of the app build.
  transpilePackages: ['@titrra/db', '@titrra/types'],
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'chewybytes',

  project: 'titrra-web',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: '/monitoring',

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
