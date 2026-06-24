'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useOnboarding } from '@/contexts/onboarding';
import { trackEvent } from '@/lib/analytics';

const STEPS = [
  'Saving your medication…',
  'Mapping your titration ladder…',
  'Setting up your plan…',
];

// The loader — manufactures anticipation AND is where the real atomic commit()
// to the server happens, so the wait is real work, not theater. Mirrors mobile.
const BuildingStep = () => {
  const router = useRouter();
  const { commit, markOnboarded, data } = useOnboarding();
  const [label, setLabel] = useState(STEPS[0]);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    trackEvent('onboarding_completed');

    let i = 0;
    const ticker = setInterval(() => {
      i = Math.min(i + 1, STEPS.length - 1);
      setLabel(STEPS[i]);
    }, 700);

    const run = async () => {
      const started = Date.now();
      let committed = true;
      try {
        await commit();
        // The defining activation event — only on a successful commit with a
        // chosen medication.
        if (data.drug) trackEvent('medication_added', { drug: data.drug });
      } catch (err) {
        console.error('[onboarding] commit failed', err);
        committed = false;
        toast.error(
          "We couldn't save your plan. You can retry on the next screen.",
        );
      }
      // Mark onboarded locally regardless (answers persist; reveal offers retry).
      markOnboarded();
      const elapsed = Date.now() - started;
      const wait = Math.max(0, 2000 - elapsed);
      setTimeout(() => {
        clearInterval(ticker);
        router.replace(
          committed
            ? '/onboarding/reveal'
            : '/onboarding/reveal?commitFailed=1',
        );
      }, wait);
    };
    run();

    return () => clearInterval(ticker);
  }, [commit, markOnboarded, router, data.drug]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-white px-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-accent text-teal-deep">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 3v16a2 2 0 0 0 2 2h16" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      </div>
      <div className="mt-8 size-6 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      <p className="mt-5 text-[16px] font-semibold text-ink">{label}</p>
    </div>
  );
};

export default BuildingStep;
