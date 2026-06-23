'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { ProgressDots } from '@/components/onboarding/ProgressDots';

type OnboardingStepProps = {
  // 1-based step index + total, drives the progress bar. Omit on the welcome.
  step?: number;
  total?: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onContinue: () => void;
  continueLabel?: string;
  canContinue?: boolean;
  onSkip?: () => void;
  hideBack?: boolean;
};

// Shared onboarding chrome mirroring the mobile OnboardingStep: back chevron +
// progress dots + skip, a Bricolage title, and a sticky Continue button.
export const OnboardingStep = ({
  step,
  total,
  title,
  subtitle,
  children,
  onContinue,
  continueLabel = 'Continue',
  canContinue = true,
  onSkip,
  hideBack,
}: OnboardingStepProps) => {
  const router = useRouter();
  const showProgress = step != null && total != null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-sand">
      {/* Header: back + progress dots + skip */}
      <div className="px-5 pt-6">
        <div className="flex h-9 items-center justify-between">
          {!hideBack ? (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex size-9 items-center justify-center text-muted-foreground hover:text-ink"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          ) : (
            <span className="size-9" />
          )}
          {showProgress ? (
            <ProgressDots total={total} activeIndex={step - 1} />
          ) : (
            <span />
          )}
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="text-[14px] font-semibold text-muted-foreground hover:text-ink"
            >
              Skip
            </button>
          ) : (
            <span className="w-9" />
          )}
        </div>
      </div>

      <div className="flex-1 px-6 pt-6">
        <h1 className="font-heading text-[30px] font-bold leading-[36px] text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 text-[15px] leading-[22px] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-7">{children}</div>
      </div>

      {/* Sticky continue bar */}
      <div className="sticky bottom-0 bg-sand px-5 pb-6 pt-3">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className={`w-full rounded-2xl px-6 py-4 text-[16px] font-bold uppercase tracking-[1px] text-white transition-colors ${
            canContinue
              ? 'bg-teal hover:bg-teal-deep'
              : 'cursor-not-allowed bg-teal/40'
          }`}
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
};

export default OnboardingStep;
