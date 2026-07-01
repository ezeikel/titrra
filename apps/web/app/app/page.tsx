'use client';

import {
  type InjectionSite,
  isOverusingRegion,
  type RecentDose,
  SITE_LABELS,
  suggestNextSite,
} from '@titrra/types';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/components/Icon';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { trackEvent } from '@/lib/analytics';
import {
  type DoseRecord,
  type Drug,
  getMedication,
  listDoses,
  listSteps,
  logDose as logDoseApi,
} from '@/lib/api';
import { useBodyShape } from '@/lib/body-shape';
import { getDrugMeta } from '@/lib/glp1';

const BodyMap3D = dynamic(
  () => import('@/components/bodymap/BodyMap3D').then((m) => m.BodyMap3D),
  { ssr: false },
);

const FALLBACK_DOSES = [0.25, 0.5, 1, 1.7, 2.4, 2.5, 5, 7.5, 10, 15];

const formatRelative = (takenAt: Date): string => {
  const days = Math.floor((Date.now() - takenAt.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
};

type HistoryItem = RecentDose & { doseMg: number; id?: string };
const toHistory = (doses: DoseRecord[]): HistoryItem[] =>
  doses.map((d) => ({
    id: d.id,
    injectionSite: d.injectionSite,
    takenAt: new Date(d.takenAt),
    doseMg: d.doseMg,
  }));

const nearest = (target: number, options: number[]): number =>
  options.reduce(
    (best, o) => (Math.abs(o - target) < Math.abs(best - target) ? o : best),
    options[0],
  );

// Today — the one-tap "log this week's shot" hub. Predicts dose (titration
// ladder / last dose) + site (rotation), so the happy path is a single click.
// Mirrors apps/mobile/app/(tabs)/index.tsx.
const Today = () => {
  const { bodyShape } = useBodyShape();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [drug, setDrug] = useState<Drug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  const suggested = useMemo(() => suggestNextSite(history), [history]);
  const [site, setSite] = useState<InjectionSite>(suggested);
  const [doseMg, setDoseMg] = useState<number>(2.5);
  const overusing = useMemo(() => isOverusingRegion(history), [history]);

  const doseOptions = useMemo(
    () => (drug ? getDrugMeta(drug).doses : FALLBACK_DOSES),
    [drug],
  );

  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [{ doses }, med, steps] = await Promise.all([
        listDoses(),
        getMedication().catch(() => null),
        listSteps().catch(() => null),
      ]);
      if (!mounted.current) return;

      const items = toHistory(doses);
      setHistory(items);
      setSite(suggestNextSite(items));

      const drugVal = med?.medication.drug ?? null;
      setDrug(drugVal);
      const rungs = drugVal ? getDrugMeta(drugVal).doses : FALLBACK_DOSES;

      const currentRung = steps?.steps.find((s) => s.actualStartDate != null);
      const predicted =
        items[0]?.doseMg ?? currentRung?.doseMg ?? rungs[0] ?? 2.5;
      setDoseMg(nearest(predicted, rungs));
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : 'Could not load your doses');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const logDose = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const optimistic: HistoryItem = {
      id: `optimistic-${Date.now()}`,
      injectionSite: site,
      takenAt: new Date(),
      doseMg,
    };
    const prev = history;
    const nextHistory = [optimistic, ...history];
    setHistory(nextHistory);
    setSite(suggestNextSite(nextHistory));
    setAdjusting(false);
    try {
      await logDoseApi({ doseMg, injectionSite: site });
      trackEvent('dose_logged', { source: 'today_cta', site, doseMg });
      toast.success('Dose logged.');
      await load();
    } catch (e) {
      setHistory(prev);
      setSite(suggestNextSite(prev));
      setError(e instanceof Error ? e.message : 'Could not save your dose');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold
      eyebrow="Today"
      title="Log today's shot"
      subtitle="Titrra predicts your dose and rotates your injection site — so logging is one tap."
      disclaimer
    >
      {loading ? (
        <div className="flex flex-col items-center py-16">
          <div className="size-6 animate-spin rounded-full border-2 border-teal border-t-transparent" />
          <p className="mt-3 text-[13px] text-muted-foreground">
            Loading your plan…
          </p>
        </div>
      ) : (
        <>
          {error ? (
            <div className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
              <p className="text-[14px] text-ink">{error}</p>
              <button
                type="button"
                onClick={load}
                className="mt-2 text-[14px] font-semibold text-teal hover:underline"
              >
                Try again
              </button>
            </div>
          ) : null}

          {/* One-tap log hero */}
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-teal">
              This week&apos;s shot
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-teal">
                <Icon icon="syringe" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-heading text-[24px] font-bold leading-[28px] text-ink">
                  {doseMg} mg · {SITE_LABELS[site]}
                </p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {site === suggested
                    ? 'Suggested site — rested longest.'
                    : 'Your chosen site.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logDose}
              disabled={saving}
              className={`mt-5 w-full rounded-2xl py-4 text-[16px] font-bold uppercase tracking-[1px] text-white transition-colors ${
                saving ? 'bg-teal/60' : 'bg-teal hover:bg-teal-deep'
              }`}
            >
              {saving ? 'Saving…' : "Log this week's shot"}
            </button>

            <button
              type="button"
              onClick={() => setAdjusting((a) => !a)}
              className="mt-3 w-full py-1 text-center text-[13px] font-semibold text-muted-foreground hover:text-ink"
            >
              {adjusting ? 'Done adjusting' : 'Adjust dose or site'}
            </button>
          </div>

          {/* Adjust panel */}
          {adjusting ? (
            <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-[12px] font-bold uppercase tracking-[2px] text-muted-foreground">
                Dose
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {doseOptions.map((d) => {
                  const selected = d === nearest(doseMg, doseOptions);
                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setDoseMg(d)}
                      className={`rounded-xl border-2 px-4 py-2 text-[15px] font-bold transition-colors ${
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

              <p className="mt-7 text-[12px] font-bold uppercase tracking-[2px] text-muted-foreground">
                Injection site
              </p>
              <div className="mt-3">
                <BodyMap3D
                  selected={site}
                  suggested={suggested}
                  recent={history}
                  onSelect={setSite}
                  bodyShape={bodyShape}
                />
              </div>
            </div>
          ) : null}

          {overusing ? (
            <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-warn/40 bg-warn/10 p-4">
              <span className="text-warn">⚠</span>
              <p className="flex-1 text-[13px] leading-[18px] text-ink">
                Your last few shots were in the same area. Spreading sites out
                helps avoid skin changes — try a different region today.
              </p>
            </div>
          ) : null}

          {/* Recent doses */}
          {history.length > 0 ? (
            <div className="mt-9">
              <p className="text-[12px] font-bold uppercase tracking-[2px] text-muted-foreground">
                Recent doses
              </p>
              <div className="mt-3.5 flex flex-col gap-2.5">
                {history.slice(0, 5).map((d, i) => (
                  <div
                    key={d.id ?? `${(d.takenAt as Date).toISOString()}-${i}`}
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-sm"
                  >
                    <span className="text-[15px] font-semibold text-ink">
                      {d.doseMg} mg
                      {d.injectionSite ? (
                        <span className="font-normal text-muted-foreground">
                          {' '}
                          · {SITE_LABELS[d.injectionSite]}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {formatRelative(d.takenAt as Date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </ScreenScaffold>
  );
};

export default Today;
