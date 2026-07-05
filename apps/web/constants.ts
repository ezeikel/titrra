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

// Single tier, so the "plan" is just the billing period (matches the
// BillingPeriod enum in packages/db).
export type BillingPeriod = 'MONTHLY' | 'ANNUAL' | 'LIFETIME';

// Resolve the Stripe price id for a billing period from env (server-side).
export const priceIdFor = (period: BillingPeriod): string | undefined => {
  switch (period) {
    case 'MONTHLY':
      return process.env.STRIPE_PRICE_PRO_MONTHLY;
    case 'ANNUAL':
      return process.env.STRIPE_PRICE_PRO_ANNUAL;
    case 'LIFETIME':
      return process.env.STRIPE_PRICE_PRO_LIFETIME;
  }
};

// Map a Stripe price id back to its billing period (used by the webhook).
export const billingPeriodForPrice = (
  priceId: string | undefined | null,
): BillingPeriod | null => {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return 'MONTHLY';
  if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) return 'ANNUAL';
  if (priceId === process.env.STRIPE_PRICE_PRO_LIFETIME) return 'LIFETIME';
  return null;
};

// LIFETIME is a one-time payment; monthly/annual are recurring subscriptions.
export const modeForPeriod = (
  period: BillingPeriod,
): 'subscription' | 'payment' =>
  period === 'LIFETIME' ? 'payment' : 'subscription';

// Map a Stripe subscription status to our SubscriptionStatus enum values.
export const mapStripeStatus = (
  status: Stripe.Subscription.Status,
):
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'INCOMPLETE'
  | 'UNPAID'
  | 'PAUSED' => {
  switch (status) {
    case 'trialing':
      return 'TRIALING';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELLED';
    case 'unpaid':
      return 'UNPAID';
    case 'paused':
      return 'PAUSED';
    default:
      return 'INCOMPLETE';
  }
};

// Supported display currencies. Stripe presents the matching currency at
// checkout (the Prices are multi-currency); these drive the paywall copy so the
// displayed number matches what the customer will actually be charged.
export type DisplayCurrency = 'USD' | 'GBP' | 'EUR';

const CURRENCY_SYMBOL: Record<DisplayCurrency, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
};

// Amounts per plan per currency (must match the Stripe Price currency_options).
// Aligned to the App Store's localized tiers for the $7.99/$39.99/$59.99 USD
// base, so web + iOS + Android all show the same price.
const PRICE_AMOUNTS: Record<BillingPeriod, Record<DisplayCurrency, string>> = {
  MONTHLY: { USD: '7.99', GBP: '7.99', EUR: '8.99' },
  ANNUAL: { USD: '39.99', GBP: '39.99', EUR: '44.99' },
  LIFETIME: { USD: '59.99', GBP: '59.99', EUR: '64.99' },
};

type PlanDisplay = {
  period: BillingPeriod;
  label: string;
  cadence: string;
  note?: string;
  bestValue?: boolean;
};

const PLAN_DISPLAY: PlanDisplay[] = [
  {
    period: 'ANNUAL',
    label: 'Yearly',
    cadence: '/year',
    note: '3-day free trial',
    bestValue: true,
  },
  { period: 'MONTHLY', label: 'Monthly', cadence: '/month' },
  {
    period: 'LIFETIME',
    label: 'Lifetime',
    cadence: 'once',
    note: 'Pay once, keep forever',
  },
];

// Honest display pricing for the paywall in the visitor's currency (no
// fabricated social proof). The real charge comes from Stripe at checkout.
export const proPricing = (
  currency: DisplayCurrency = 'USD',
): (PlanDisplay & { price: string })[] =>
  PLAN_DISPLAY.map((p) => ({
    ...p,
    price: `${CURRENCY_SYMBOL[currency]}${PRICE_AMOUNTS[p.period][currency]}`,
  }));
