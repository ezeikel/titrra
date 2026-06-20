// Pro is one clean entitlement across both platforms (Stripe on web,
// RevenueCat on mobile). These ids MUST match the RevenueCat dashboard +
// Stripe price metadata exactly. See docs/GLP1-RESEARCH-AND-SPEC.md §4.

export const PRO_ENTITLEMENT = 'titrra_pro';
export const DEFAULT_OFFERING = 'default';

// RevenueCat's built-in package ids for the three Pro options.
export const PRO_PACKAGES = {
  monthly: '$rc_monthly',
  annual: '$rc_annual',
  lifetime: '$rc_lifetime',
} as const;

export type ProPackageId = (typeof PRO_PACKAGES)[keyof typeof PRO_PACKAGES];

export type BillingPeriod = 'monthly' | 'annual' | 'lifetime';

// Unified view the app reads regardless of which store sold the subscription.
export type ProStatus = {
  isPro: boolean;
  billingPeriod: BillingPeriod | null;
  isTrialing: boolean;
  expiresAt: string | null;
};
