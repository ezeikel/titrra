'use client';

import { useRouter } from 'next/navigation';
import type { WeightUnit } from '@/lib/api';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';

const TOTAL = 8;

const WeightStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();
  const next = () => router.push('/onboarding/side-effects');
  const skip = () => {
    set({ currentWeight: null });
    next();
  };

  return (
    <OnboardingStep
      step={5}
      total={TOTAL}
      title="What's your starting weight?"
      subtitle="Optional — it sets the baseline for your progress. You can skip this."
      onSkip={skip}
      canContinue
      continueLabel={data.currentWeight != null ? 'Continue' : 'Skip for now'}
      onContinue={data.currentWeight != null ? next : skip}
    >
      <div className="flex items-center gap-3">
        <input
          value={data.currentWeight != null ? String(data.currentWeight) : ''}
          onChange={(e) => {
            const t = e.target.value;
            const n = Number(t);
            set({ currentWeight: t && Number.isFinite(n) && n > 0 ? n : null });
          }}
          placeholder="0.0"
          inputMode="decimal"
          className="h-14 flex-1 rounded-2xl border-2 border-border bg-white px-4 text-[20px] font-bold text-ink outline-none focus:border-teal"
        />
        <div className="flex overflow-hidden rounded-2xl border border-border">
          {(['KG', 'LB'] as WeightUnit[]).map((u) => {
            const selected = u === data.weightUnit;
            return (
              <button
                type="button"
                key={u}
                onClick={() => set({ weightUnit: u })}
                aria-pressed={selected}
                className={`px-5 py-4 text-[14px] font-bold ${
                  selected ? 'bg-teal text-white' : 'bg-white text-muted-foreground'
                }`}
              >
                {u.toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>
    </OnboardingStep>
  );
};

export default WeightStep;
