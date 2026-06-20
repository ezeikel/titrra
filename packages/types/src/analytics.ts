// Shared analytics event vocabulary so web (PostHog + Vercel) and mobile
// (PostHog) funnels line up. Keep event names snake_case and stable — renaming
// one breaks historical funnels.

export type AnalyticsEvent =
  | 'app_opened'
  | 'waitlist_joined'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'medication_added'
  | 'dose_logged'
  | 'dose_skipped'
  | 'weight_logged'
  | 'side_effect_logged'
  | 'titration_step_added'
  | 'reminder_set'
  | 'paywall_viewed'
  | 'paywall_dismissed'
  | 'purchase_started'
  | 'purchase_completed'
  | 'purchase_restored'
  | 'export_generated';

// Loose by design — analytics props are free-form. Tighten per-event as the
// product hardens.
export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;
