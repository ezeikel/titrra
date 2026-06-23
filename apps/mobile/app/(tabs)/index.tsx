import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { BodyMapSwitch } from '@/components/BodyMapSwitch';
import { EmptyState } from '@/components/EmptyState';
import { ErrorRetry } from '@/components/ErrorRetry';
import { Icon } from '@/components/Icon';
import { ProBadge } from '@/components/ProBadge';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { Stepper } from '@/components/Stepper';
import { trackEvent } from '@/lib/analytics';
import { useBodyShape } from '@/lib/body-shape';
import {
  type DoseRecord,
  type Drug,
  getMedication,
  listDoses,
  listSteps,
  logDose as logDoseApi,
} from '@/lib/api';
import { elevation } from '@/lib/elevation';
import { getDrugMeta } from '@/lib/glp1';
import {
  type InjectionSite,
  isOverusingRegion,
  type RecentDose,
  SITE_LABELS,
  suggestNextSite,
} from '@/lib/rotation';

// Fallback dose rungs before the user's drug loads (generic GLP-1 set).
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

// Pick the closest available rung to a target dose (so a default always lands
// on a real tick of the ruler).
const nearest = (target: number, options: number[]): number =>
  options.reduce(
    (best, o) => (Math.abs(o - target) < Math.abs(best - target) ? o : best),
    options[0],
  );

// Today — the one-tap "log this week's shot" hub. The app PREDICTS the dose
// (from the titration ladder / last dose, filtered to the user's drug) and the
// site (rotation), so the happy path is a single tap. "Adjust" reveals the
// pickers for the rare override. Persists via the web API → @titrra/db.
const Today = () => {
  const router = useRouter();
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

  // Dose rungs for this drug (falls back to the generic set pre-load).
  const doseOptions = useMemo(
    () => (drug ? getDrugMeta(drug).doses : FALLBACK_DOSES),
    [drug],
  );

  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      setError(null);
      // Fetch in parallel: history (rotation + recent), medication (drug →
      // dose rungs), titration steps (current rung → smart dose default).
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

      // Smart dose default: last logged → current titration rung → first rung.
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
    const next = [optimistic, ...history];
    setHistory(next);
    setSite(suggestNextSite(next));
    setAdjusting(false);
    try {
      await logDoseApi({ doseMg, injectionSite: site });
      trackEvent('dose_logged', { source: 'today_cta', site, doseMg });
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
        <View className="items-center py-16">
          <ActivityIndicator color="#0e7c7b" />
          <Text className="mt-3 font-sans text-[13px] text-muted">
            Loading your plan…
          </Text>
        </View>
      ) : (
        <>
          {error ? (
            <View className="mb-4">
              <ErrorRetry message={error} onRetry={load} retrying={loading} />
            </View>
          ) : null}

          {/* ── One-tap log hero ───────────────────────────────────────── */}
          <View className="rounded-3xl bg-paper p-5" style={elevation.raised}>
            <Text className="font-sans-bold text-[11px] uppercase tracking-[2px] text-teal">
              This week's shot
            </Text>
            <View className="mt-3 flex-row items-center gap-3">
              <View className="size-12 items-center justify-center rounded-2xl bg-accent">
                <Icon icon="syringe" size={20} color="#0e7c7b" />
              </View>
              <View className="flex-1">
                <Text
                  className="font-display-bold text-[24px] leading-[28px] text-ink"
                  allowFontScaling={false}
                >
                  {doseMg} mg · {SITE_LABELS[site]}
                </Text>
                <Text className="mt-0.5 font-sans text-[13px] text-muted">
                  {site === suggested
                    ? 'Suggested site — rested longest.'
                    : 'Your chosen site.'}
                </Text>
              </View>
            </View>

            {/* Primary action — one tap logs the predicted dose + site */}
            <Pressable
              onPress={logDose}
              disabled={saving}
              accessibilityRole="button"
              accessibilityState={{ disabled: saving }}
              accessibilityLabel={`Log ${doseMg} milligram dose at ${SITE_LABELS[site]}`}
              style={saving ? undefined : elevation.card}
              className={`mt-5 flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
                saving ? 'bg-teal/60' : 'bg-teal active:bg-teal-deep'
              }`}
            >
              {saving ? <ActivityIndicator color="#faf8f3" /> : null}
              <Text className="font-sans-bold text-[16px] uppercase tracking-[1px] text-paper">
                {saving ? 'Saving…' : "Log this week's shot"}
              </Text>
            </Pressable>

            {/* Adjust toggle — the override path */}
            <Pressable
              onPress={() => setAdjusting((a) => !a)}
              accessibilityRole="button"
              accessibilityLabel={
                adjusting ? 'Hide adjust' : 'Adjust dose or site'
              }
              className="mt-3 flex-row items-center justify-center gap-1.5 py-1"
            >
              <Text className="font-sans-semibold text-[13px] text-muted">
                {adjusting ? 'Done adjusting' : 'Adjust dose or site'}
              </Text>
              <Icon
                icon={adjusting ? 'chevron-up' : 'chevron-down'}
                size={12}
                color="#5f706e"
              />
            </Pressable>
          </View>

          {/* ── Adjust panel (revealed only when overriding) ───────────── */}
          {adjusting ? (
            <View
              className="mt-4 rounded-3xl bg-card p-5"
              style={elevation.card}
            >
              {/* Dose stepper — step along the drug's real rungs */}
              <Text className="font-sans-bold text-[12px] uppercase tracking-[2px] text-faint">
                Dose
              </Text>
              <View className="mt-4 px-2">
                <Stepper
                  values={doseOptions}
                  value={nearest(doseMg, doseOptions)}
                  onChange={setDoseMg}
                  unit="mg"
                  decimals={doseMg % 1 === 0 ? 0 : 1}
                />
              </View>

              {/* Site picker — tappable body map */}
              <Text className="mt-7 font-sans-bold text-[12px] uppercase tracking-[2px] text-faint">
                Injection site
              </Text>
              <View className="mt-3">
                <BodyMapSwitch
                  selected={site}
                  suggested={suggested}
                  recent={history}
                  onSelect={setSite}
                  bodyShape={bodyShape}
                />
              </View>
            </View>
          ) : null}

          {/* Titration ladder entry */}
          <Pressable
            onPress={() => router.push('/titration')}
            accessibilityRole="button"
            accessibilityLabel="Open titration ladder"
            className="mt-4 flex-row items-center justify-between rounded-2xl bg-paper p-4 active:opacity-90"
            style={elevation.card}
          >
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-sans-semibold text-[15px] text-ink">
                  Titration ladder
                </Text>
                <ProBadge />
              </View>
              <Text className="mt-0.5 font-sans text-[13px] text-muted">
                See where you are on your titration plan from your provider.
              </Text>
            </View>
            <Icon icon="chevron-right" size={16} color="#93a09d" />
          </Pressable>

          {overusing ? (
            <View className="mt-3 flex-row items-start gap-2.5 rounded-2xl border border-warn/40 bg-warn/10 p-4">
              <Icon icon="triangle-exclamation" size={16} color="#c98a2b" />
              <Text className="flex-1 font-sans text-[13px] leading-[18px] text-ink">
                Your last few shots were in the same area. Spreading sites out
                helps avoid skin changes — try a different region today.
              </Text>
            </View>
          ) : null}

          {/* Recent doses */}
          {history.length > 0 ? (
            <View className="mt-9">
              <Text className="font-sans-bold text-[12px] uppercase tracking-[2px] text-faint">
                Recent doses
              </Text>
              <View className="mt-3.5 gap-2.5">
                {history.slice(0, 5).map((d, i) => (
                  <View
                    key={d.id ?? `${(d.takenAt as Date).toISOString()}-${i}`}
                    className="flex-row items-center justify-between rounded-2xl bg-paper px-4 py-3.5"
                    style={elevation.card}
                  >
                    <View className="flex-row items-center gap-2.5">
                      <View className="size-8 items-center justify-center rounded-xl bg-accent">
                        <Icon icon="syringe" size={13} color="#0e7c7b" />
                      </View>
                      <Text className="font-sans-bold text-[15px] text-ink">
                        {d.doseMg} mg
                      </Text>
                      <Text className="font-sans text-[13px] text-muted">
                        {SITE_LABELS[d.injectionSite as InjectionSite]}
                      </Text>
                    </View>
                    <Text className="font-sans text-[12px] text-faint">
                      {formatRelative(d.takenAt as Date)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : !error ? (
            <View className="mt-8">
              <EmptyState
                icon="syringe"
                title="No doses logged yet"
                body="Tap “Log this week's shot” after your injection. Titrra remembers each site and rotates the next one for you."
              />
            </View>
          ) : null}
        </>
      )}
    </ScreenScaffold>
  );
};

export default Today;
