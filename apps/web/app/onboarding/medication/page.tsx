'use client';

import { useRouter } from 'next/navigation';
import { ChoiceCard } from '@/components/onboarding/ChoiceCard';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';
import { DRUGS } from '@/lib/glp1';

const TOTAL = 8;

// The key config question. The chosen drug also determines form + schedule
// (handled in commit() via getDrugMeta) — smart defaults, fewer taps.
const MedicationStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();
  const first = data.name ? `${data.name}, ` : '';

  return (
    <OnboardingStep
      step={2}
      total={TOTAL}
      title={`${first}which medication are you on?`}
      subtitle="This shapes your whole plan — dose steps, schedule and reminders."
      canContinue={data.drug != null}
      onContinue={() => router.push('/onboarding/dose')}
    >
      {DRUGS.map((d) => (
        <ChoiceCard
          key={d.drug}
          label={d.label}
          sublabel={d.generic || undefined}
          selected={data.drug === d.drug}
          onPress={() =>
            set({ drug: d.drug, currentDose: null, goalDose: null })
          }
        />
      ))}
    </OnboardingStep>
  );
};

export default MedicationStep;
