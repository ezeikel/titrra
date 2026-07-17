'use client';

import { useRouter } from 'next/navigation';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';
import type { SideEffectType } from '@/lib/api';

const TOTAL = 8;

const OPTIONS: { type: SideEffectType; label: string }[] = [
  { type: 'NAUSEA', label: 'Nausea' },
  { type: 'CONSTIPATION', label: 'Constipation' },
  { type: 'DIARRHEA', label: 'Diarrhea' },
  { type: 'FATIGUE', label: 'Fatigue' },
  { type: 'REFLUX', label: 'Reflux' },
  { type: 'HEADACHE', label: 'Headache' },
];

// Multi-select empathy step — seeds the side-effects habit + makes the app feel
// like it gets their experience. All optional.
const SideEffectsStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();
  const next = () => router.push('/onboarding/body');

  const toggle = (type: SideEffectType) => {
    const has = data.sideEffects.includes(type);
    set({
      sideEffects: has
        ? data.sideEffects.filter((t) => t !== type)
        : [...data.sideEffects, type],
    });
  };

  return (
    <OnboardingStep
      step={6}
      total={TOTAL}
      title="Dealing with any of these?"
      subtitle="Tap any you've felt lately — we'll start tracking them so you can spot patterns. Optional."
      onSkip={next}
      canContinue
      continueLabel={
        data.sideEffects.length > 0 ? 'Continue' : 'None right now'
      }
      onContinue={next}
    >
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => {
          const selected = data.sideEffects.includes(o.type);
          return (
            <button
              type="button"
              key={o.type}
              onClick={() => toggle(o.type)}
              aria-pressed={selected}
              className={`rounded-full border px-4 py-2.5 text-[14px] font-semibold transition-colors ${
                selected
                  ? 'border-teal bg-accent text-teal-deep'
                  : 'border-border bg-white text-ink hover:bg-mist'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </OnboardingStep>
  );
};

export default SideEffectsStep;
