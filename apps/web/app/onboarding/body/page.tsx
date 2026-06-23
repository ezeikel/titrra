'use client';

import { useRouter } from 'next/navigation';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';
import { trackEvent } from '@/lib/analytics';
import type { BodyShape } from '@/lib/body-shape';

const TOTAL = 8;

// Neutral visual preference — which figure to show on the 3D injection-site map,
// NOT a clinical/identity question. Skipping keeps the neutral default.
const OPTIONS: { value: BodyShape; label: string; hint: string }[] = [
  { value: 'MALE', label: 'Masculine', hint: 'Broader frame' },
  { value: 'FEMALE', label: 'Feminine', hint: 'Slimmer frame' },
];

const BodyShapeStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();
  const next = () => router.push('/onboarding/reminders');

  const choose = (value: BodyShape) => {
    set({ bodyShape: value });
    trackEvent('body_shape_set', { value, source: 'onboarding' });
  };

  return (
    <OnboardingStep
      step={7}
      total={TOTAL}
      title="Which body would you like to see?"
      subtitle="We'll show your injection sites on this figure. Purely a visual preference — you can change it any time in Settings."
      onSkip={() => {
        set({ bodyShape: 'UNSPECIFIED' });
        next();
      }}
      canContinue
      continueLabel={data.bodyShape !== 'UNSPECIFIED' ? 'Continue' : 'Skip'}
      onContinue={next}
    >
      <div className="flex flex-col gap-3">
        {OPTIONS.map((o) => {
          const selected = data.bodyShape === o.value;
          return (
            <button
              type="button"
              key={o.value}
              onClick={() => choose(o.value)}
              aria-pressed={selected}
              className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition-colors ${
                selected
                  ? 'border-teal bg-accent'
                  : 'border-border bg-white hover:bg-mist'
              }`}
            >
              <span>
                <span
                  className={`block text-[16px] font-semibold ${
                    selected ? 'text-teal-deep' : 'text-ink'
                  }`}
                >
                  {o.label}
                </span>
                <span
                  className={`mt-0.5 block text-[13px] ${
                    selected ? 'text-teal-deep/80' : 'text-muted-foreground'
                  }`}
                >
                  {o.hint}
                </span>
              </span>
              <span
                className={`flex size-6 items-center justify-center rounded-full border-2 ${
                  selected ? 'border-teal bg-teal' : 'border-border'
                }`}
              >
                {selected ? (
                  <span className="size-2.5 rounded-full bg-white" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </OnboardingStep>
  );
};

export default BodyShapeStep;
