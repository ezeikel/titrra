'use client';

import type { AnalyticsEvent, AnalyticsProperties } from '@titrra/types';
import { track as vercelTrack } from '@vercel/analytics';
import posthog from 'posthog-js';

export type { AnalyticsEvent } from '@titrra/types';

// Dual-write custom events to PostHog + Vercel Analytics (same pattern as the
// other Chewy Bytes apps). Pageviews are automatic on both — never capture
// those here.
export const trackEvent = (
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
) => {
  if (typeof window === 'undefined') return;
  posthog.capture(event, properties);
  try {
    vercelTrack(event, properties);
  } catch {
    // Vercel Analytics unavailable (dev) — PostHog capture already succeeded.
  }
};
