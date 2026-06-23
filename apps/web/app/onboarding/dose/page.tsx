'use client';

import { useRouter } from 'next/navigation';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';
import { getDrugMeta } from '@/lib/glp1';

const TOTAL = 8;

const DoseStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();
  const meta = data.drug ? getDrugMeta(data.drug) : null;

  return (
    <OnboardingStep
      step={3}
      total={TOTAL}
      title={`What dose are you on now${data.name ? `, ${data.name}` : ''}?`}
      subtitle="Pick where you are today. You can fine-tune your ladder later."
      canContinue={data.currentDose != null}
      onContinue={() => router.push('/onboarding/goal')}
    >
      <div className="flex flex-wrap gap-2">
        {(meta?.doses ?? []).map((d) => {
          const selected = d === data.currentDose;
          return (
            <button
              type="button"
              key={d}
              onClick={() => set({ currentDose: d })}
              aria-pressed={selected}
              className={`rounded-2xl border-2 px-5 py-3 text-[16px] font-bold transition-colors ${
                selected
                  ? 'border-teal bg-accent text-teal-deep'
                  : 'border-border bg-white text-ink hover:bg-mist'
              }`}
            >
              {d} mg
            </button>
          );
        })}
      </div>
      <p className="mt-6 text-[12px] leading-[17px] text-muted-foreground">
        For tracking and education only. Not medical advice — always confirm
        doses with your healthcare provider.
      </p>
    </OnboardingStep>
  );
};

export default DoseStep;
