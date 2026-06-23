'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { useOnboarding } from '@/contexts/onboarding';
import { getDrugMeta } from '@/lib/glp1';

// Value reveal — the earned payoff. Recaps the real plan (drug, ladder, goal),
// then hands off to the app. Mirrors mobile; the paywall handoff is deferred
// (web Pro/Stripe is a later pass), so "See my plan" goes to Today.
const RevealInner = () => {
  const router = useRouter();
  const params = useSearchParams();
  const { data, commit } = useOnboarding();
  const meta = data.drug ? getDrugMeta(data.drug) : null;

  const [saveFailed, setSaveFailed] = useState(params.get('commitFailed') === '1');
  const [retrying, setRetrying] = useState(false);

  const retrySave = async () => {
    setRetrying(true);
    try {
      await commit();
      setSaveFailed(false);
    } catch {
      // stays failed — banner remains
    } finally {
      setRetrying(false);
    }
  };

  const ladder = useMemo(() => {
    if (data.currentDose == null) return [];
    return (meta?.doses ?? []).filter((d) => {
      if (data.goalDose != null) {
        return d >= data.currentDose! && d <= data.goalDose;
      }
      return d >= data.currentDose!;
    });
  }, [meta, data.currentDose, data.goalDose]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white">
      <div className="flex-1 px-5 pt-10">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-teal text-white">
          <svg
            width="26"
            height="26"
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
        <h1 className="mt-6 font-heading text-[30px] font-bold leading-[34px] text-ink">
          {data.name ? `${data.name}, your` : 'Your'} Titrra plan is ready.
        </h1>
        <p className="mt-3 text-[15px] leading-[22px] text-muted-foreground">
          Here&apos;s what we set up for you. Everything&apos;s editable any
          time.
        </p>

        {saveFailed ? (
          <div className="mt-5 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-[14px] text-ink">
              We couldn&apos;t save your plan to your account. Your answers are
              shown below — tap to save them.
            </p>
            <button
              type="button"
              onClick={retrySave}
              disabled={retrying}
              className="mt-3 rounded-xl bg-teal px-4 py-2 text-[14px] font-semibold text-white hover:bg-teal-deep disabled:opacity-50"
            >
              {retrying ? 'Saving…' : 'Retry'}
            </button>
          </div>
        ) : null}

        <div className="mt-7 flex flex-col gap-3">
          {meta ? (
            <div className="rounded-2xl border border-border bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-teal-deep">
                Your medication
              </p>
              <p className="mt-1 text-[20px] font-bold text-ink">{meta.label}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {meta.scheduleType === 'WEEKLY' ? 'Weekly' : 'Daily'} ·{' '}
                {meta.form === 'INJECTION' ? 'Injection' : 'Pill'}
              </p>
            </div>
          ) : null}

          {ladder.length > 0 ? (
            <div className="rounded-2xl border border-border bg-white p-5">
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
                          : 'bg-mist text-ink'
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
              <p className="mt-3 text-[13px] text-muted-foreground">
                Starting at {data.currentDose} mg
                {data.goalDose ? `, goal ${data.goalDose} mg` : ''}.
              </p>
            </div>
          ) : null}

          {data.currentWeight != null ? (
            <div className="rounded-2xl border border-border bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-teal-deep">
                Starting weight
              </p>
              <p className="mt-1 text-[20px] font-bold text-ink">
                {data.currentWeight} {data.weightUnit.toLowerCase()}
              </p>
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-[11px] leading-[16px] text-muted-foreground">
          For tracking and education only. Not medical advice. Your plan reflects
          what you told us — confirm doses with your provider.
        </p>
      </div>

      <div className="sticky bottom-0 bg-white px-5 pb-6 pt-3">
        <button
          type="button"
          onClick={() => router.replace('/')}
          className="w-full rounded-2xl bg-teal px-6 py-4 text-[16px] font-bold uppercase tracking-[1px] text-white hover:bg-teal-deep"
        >
          See my plan
        </button>
      </div>
    </div>
  );
};

const RevealStep = () => (
  <Suspense fallback={null}>
    <RevealInner />
  </Suspense>
);

export default RevealStep;
