'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';
import { getDrugMeta } from '@/lib/glp1';

const TOTAL = 8;

const GoalStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();
  const meta = data.drug ? getDrugMeta(data.drug) : null;

  const goalOptions = useMemo(
    () =>
      (meta?.doses ?? []).filter(
        (d) => data.currentDose == null || d >= data.currentDose,
      ),
    [meta, data.currentDose],
  );

  const ladder = useMemo(() => {
    if (data.currentDose == null || data.goalDose == null) return [];
    return (meta?.doses ?? []).filter(
      (d) => d >= data.currentDose! && d <= data.goalDose!,
    );
  }, [meta, data.currentDose, data.goalDose]);

  return (
    <OnboardingStep
      step={4}
      total={TOTAL}
      title="Where are you headed?"
      subtitle="Pick your target dose and we'll map your titration ladder."
      canContinue={data.goalDose != null}
      onContinue={() => router.push('/onboarding/weight')}
    >
      <div className="flex flex-wrap gap-2">
        {goalOptions.map((d) => {
          const selected = d === data.goalDose;
          return (
            <button
              type="button"
              key={d}
              onClick={() => set({ goalDose: d })}
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

      {ladder.length > 0 ? (
        <div className="mt-7 rounded-2xl bg-accent p-5">
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-teal-deep">
            Your titration ladder
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-2">
            {ladder.map((d, i) => (
              <span key={d} className="flex items-center">
                <span
                  className={`rounded-lg px-3 py-1.5 text-[14px] font-bold ${
                    d === data.currentDose
                      ? 'bg-teal text-white'
                      : 'bg-white text-ink'
                  }`}
                >
                  {d}
                </span>
                {i < ladder.length - 1 ? (
                  <span className="px-1 text-[13px] font-bold text-teal-deep">
                    →
                  </span>
                ) : null}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-[18px] text-muted-foreground">
            {ladder.length} steps, starting at {data.currentDose} mg. We&apos;ll
            remind you when it&apos;s time to talk to your provider about
            stepping up.
          </p>
        </div>
      ) : null}
    </OnboardingStep>
  );
};

export default GoalStep;
