import type Stripe from 'stripe';

// Pin the Stripe API version so behaviour is stable across SDK upgrades. Bump
// deliberately (and test) when upgrading the `stripe` package.
export const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-08-27.basil';

// Titrra Pro — one clean honest tier (see docs/GLP1-RESEARCH-AND-SPEC.md §4).
// $7.99/mo · $39.99/yr (hero) · $59.99 lifetime. 3-day trial on annual.
export const PRO_PRICE_ENV = {
  monthly: 'STRIPE_PRICE_PRO_MONTHLY',
  annual: 'STRIPE_PRICE_PRO_ANNUAL',
  lifetime: 'STRIPE_PRICE_PRO_LIFETIME',
} as const;
