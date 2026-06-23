'use client';

import { useRouter } from 'next/navigation';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';

const TOTAL = 8;

const NameStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();
  const next = () => router.push('/onboarding/medication');

  return (
    <OnboardingStep
      step={1}
      total={TOTAL}
      title="First, what should we call you?"
      subtitle="We'll use it to keep things personal — nothing more."
      hideBack
      canContinue={data.name.trim().length > 0}
      onContinue={next}
    >
      <input
        value={data.name}
        onChange={(e) => set({ name: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && data.name.trim()) next();
        }}
        placeholder="Your name"
        autoFocus
        autoCapitalize="words"
        className="h-14 w-full rounded-2xl border-2 border-border bg-white px-4 text-[20px] font-bold text-ink outline-none focus:border-teal"
      />
    </OnboardingStep>
  );
};

export default NameStep;
