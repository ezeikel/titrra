import { createClient } from 'next-sanity';

export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-01';

// Load-bearing: every fetcher short-circuits on this so `next build` never
// fails before Sanity is wired (CI checkouts, preview envs without env vars).
export const isSanityConfigured = projectId !== 'placeholder';

// Read-only client (no token). The write path lives ONLY in the worker, so the
// write token never reaches the Next bundle.
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
});
