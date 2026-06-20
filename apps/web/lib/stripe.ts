import Stripe from 'stripe';
import { STRIPE_API_VERSION } from '@/constants';

// Single server-side Stripe client (mirrors chunky-crayon's lib/stripe.ts).
// STRIPE_SECRET_KEY is server-only — never expose it to the client. The
// publishable key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) is used in the browser
// checkout redirect, set up separately when the checkout flow is built.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: STRIPE_API_VERSION,
});
