import Stripe from 'stripe';
import { STRIPE_API_VERSION } from '@/constants';

// STRIPE_SECRET_KEY is server-only — never expose it to the client. The
// publishable key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) is used in the browser.
// Titrra uses STRIPE_SECRET_KEY (NOT chunky-crayon's STRIPE_SECRET).

export const isStripeConfigured = (): boolean =>
  Boolean(process.env.STRIPE_SECRET_KEY);

let cached: Stripe | null = null;

// Lazily construct the client so importing this module never throws when the
// key is unset (local dev, CI, preview) — routes guard on isStripeConfigured()
// and return a clean 503 before calling getStripe().
export const getStripe = (): Stripe => {
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: STRIPE_API_VERSION,
    });
  }
  return cached;
};
