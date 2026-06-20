import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { trackEvent } from '@/lib/analytics';
import {
  INJECTION_SITES,
  type InjectionSite,
  isOverusingRegion,
  type RecentDose,
  SITE_LABELS,
  suggestNextSite,
} from '@/lib/rotation';

// Common GLP-1 dose rungs (mg). Real values come from the user's titration
// ladder once that's wired; this is the quick-pick fallback.
const DOSE_OPTIONS = [0.25, 0.5, 1, 1.7, 2.4, 2.5, 5, 7.5, 10, 15];

const formatRelative = (takenAt: Date): string => {
  const days = Math.floor((Date.now() - takenAt.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
};

// Today — the one-tap "logged today's shot" hub + the signature injection-site
// rotation map (spec §3, items 2–3). State is local for now; persistence to
// @titrra/db is the next wiring step (see TODOs).
const Today = () => {
  const [history, setHistory] = useState<(RecentDose & { doseMg: number })[]>(
    [],
  );
  const suggested = useMemo(() => suggestNextSite(history), [history]);
  const [site, setSite] = useState<InjectionSite>(suggested);
  const [doseMg, setDoseMg] = useState<number>(2.5);
  const overusing = useMemo(() => isOverusingRegion(history), [history]);

  const logDose = () => {
    const entry = { injectionSite: site, takenAt: new Date(), doseMg };
    // TODO: persist via @titrra/db (DoseLog) instead of local state.
    const next = [entry, ...history];
    setHistory(next);
    setSite(suggestNextSite(next));
    trackEvent('dose_logged', { source: 'today_cta', site, doseMg });
  };

  return (
    <ScreenScaffold
      eyebrow="Today"
      title="Log today's shot"
      subtitle="One tap to record your dose. Titrra rotates your injection site for you so no spot gets overused."
      disclaimer
    >
      {/* Suggested next site */}
      <View className="rounded-2xl bg-accent p-5">
        <Text className="font-sans-bold text-[11px] uppercase tracking-[2px] text-teal-deep">
          Suggested next site
        </Text>
        <View className="mt-2 flex-row items-center gap-2">
          <Icon icon="syringe" size={18} />
          <Text className="font-sans-bold text-[22px] text-ink">
            {SITE_LABELS[suggested]}
          </Text>
        </View>
        <Text className="mt-1 font-sans text-[13px] text-muted">
          Rested the longest based on your recent doses.
        </Text>
      </View>

      {overusing ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-xl border border-warn/40 bg-warn/10 p-4">
          <Icon icon="triangle-exclamation" size={16} />
          <Text className="flex-1 font-sans text-[13px] leading-[18px] text-ink">
            Your last few shots were in the same area. Spreading sites out helps
            avoid skin changes — try a different region today.
          </Text>
        </View>
      ) : null}

      {/* Site picker */}
      <Text className="mt-7 font-sans-semibold text-[13px] uppercase tracking-[2px] text-muted">
        Where are you injecting?
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {INJECTION_SITES.map((s) => {
          const selected = s === site;
          const isSuggested = s === suggested;
          return (
            <Pressable
              key={s}
              onPress={() => setSite(s)}
              className={`rounded-xl border px-4 py-3 ${
                selected
                  ? 'border-teal bg-teal'
                  : 'border-border bg-sand active:bg-mist'
              }`}
            >
              <Text
                className={`font-sans-semibold text-[14px] ${
                  selected ? 'text-paper' : 'text-ink'
                }`}
              >
                {SITE_LABELS[s]}
              </Text>
              {isSuggested && !selected ? (
                <Text className="font-sans text-[10px] uppercase tracking-[1px] text-teal-deep">
                  Suggested
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Dose picker */}
      <Text className="mt-7 font-sans-semibold text-[13px] uppercase tracking-[2px] text-muted">
        Dose
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {DOSE_OPTIONS.map((d) => {
          const selected = d === doseMg;
          return (
            <Pressable
              key={d}
              onPress={() => setDoseMg(d)}
              className={`rounded-xl border px-4 py-2.5 ${
                selected
                  ? 'border-teal bg-teal'
                  : 'border-border bg-sand active:bg-mist'
              }`}
            >
              <Text
                className={`font-sans-semibold text-[14px] ${
                  selected ? 'text-paper' : 'text-ink'
                }`}
              >
                {d} mg
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Log button */}
      <Pressable
        onPress={logDose}
        className="mt-8 items-center rounded-2xl bg-teal px-6 py-5 active:bg-teal-deep"
      >
        <Text className="font-sans-bold text-[16px] uppercase tracking-[1px] text-paper">
          Log {doseMg} mg · {SITE_LABELS[site]}
        </Text>
      </Pressable>

      {/* Recent doses */}
      {history.length > 0 ? (
        <View className="mt-8">
          <Text className="font-sans-semibold text-[13px] uppercase tracking-[2px] text-muted">
            Recent doses
          </Text>
          <View className="mt-3 gap-2">
            {history.slice(0, 5).map((d, i) => (
              <View
                key={`${(d.takenAt as Date).toISOString()}-${i}`}
                className="flex-row items-center justify-between rounded-xl border border-border bg-sand px-4 py-3"
              >
                <View className="flex-row items-center gap-2">
                  <Icon icon="syringe" size={14} />
                  <Text className="font-sans-semibold text-[14px] text-ink">
                    {d.doseMg} mg
                  </Text>
                  <Text className="font-sans text-[13px] text-muted">
                    {SITE_LABELS[d.injectionSite as InjectionSite]}
                  </Text>
                </View>
                <Text className="font-sans text-[12px] text-muted">
                  {formatRelative(d.takenAt as Date)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScreenScaffold>
  );
};

export default Today;
