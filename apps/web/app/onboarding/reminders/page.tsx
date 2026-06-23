'use client';

import { useRouter } from 'next/navigation';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';
import { trackEvent } from '@/lib/analytics';

const TOTAL = 8;

// Web has no native push; this records the preference (the mobile app owns the
// actual local notifications). Kept in the flow for parity + funnel symmetry.
const RemindersStep = () => {
  const router = useRouter();
  const { set } = useOnboarding();
  const next = () => router.push('/onboarding/building');

  const enable = () => {
    set({ remindersOptIn: true });
    trackEvent('reminder_set', { granted: true });
    next();
  };

  return (
    <OnboardingStep
      step={8}
      total={TOTAL}
      title="Want a nudge on shot day?"
      subtitle="A gentle reminder so your dose never sneaks up on you. You can change this any time."
      onSkip={() => {
        set({ remindersOptIn: false });
        next();
      }}
      canContinue
      continueLabel="Turn on reminders"
      onContinue={enable}
    >
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-teal-deep">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-ink">
              Shot day reminders
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              On your schedule, never spammy.
            </p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          set({ remindersOptIn: false });
          next();
        }}
        className="mt-4 w-full py-2 text-center text-[14px] font-semibold text-muted-foreground hover:text-ink"
      >
        Maybe later
      </button>
    </OnboardingStep>
  );
};

export default RemindersStep;
