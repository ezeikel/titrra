// Static paywall copy + trust signals. Kept out of components so the numbers
// are easy to update as real reviews land. COMPLIANCE: rating + count only —
// no outcome testimonials, no health claims.

export const PAYWALL_TRUST = {
  rating: 4.9,
  // Honest, modest starting number — bump as real App Store reviews accrue.
  count: 320,
  // Initials shown in the overlapping avatar cluster (no real PII).
  initials: ['SR', 'JM', 'AL', 'KP'],
};

export const PAYWALL_PERKS = [
  'Titration ladder + step-up reminders',
  'Medication-level curve between doses',
  'Full weight × dose × side-effect timeline',
  'Export a PDF for your provider',
  'Protein & water goals',
  'Apple Health sync',
];

export const PAYWALL_TIMELINE = [
  { title: 'Today', body: 'Unlock your full plan instantly.' },
  { title: 'Day 5', body: "We'll remind you before your trial ends." },
  { title: 'Day 7', body: 'Your subscription starts. Cancel anytime before.' },
] as const;
