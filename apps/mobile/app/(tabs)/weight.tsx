import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ErrorRetry } from '@/components/ErrorRetry';
import { Ruler } from '@/components/Ruler';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { trackEvent } from '@/lib/analytics';
import {
  listWeights,
  logWeight as logWeightApi,
  type WeightRecord,
  type WeightUnit,
} from '@/lib/api';
import { elevation } from '@/lib/elevation';

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Ruler ranges per unit (0.5 increments — fine enough for weigh-ins, coarse
// enough to be a smooth scroll). Defaults to the last weigh-in.
const RANGES: Record<
  WeightUnit,
  { min: number; max: number; default: number }
> = {
  KG: { min: 40, max: 200, default: 80 },
  LB: { min: 90, max: 440, default: 176 },
};
const buildRange = (unit: WeightUnit): number[] => {
  const { min, max } = RANGES[unit];
  const out: number[] = [];
  for (let v = min; v <= max; v += 0.5) out.push(Math.round(v * 10) / 10);
  return out;
};

const Weight = () => {
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [unit, setUnit] = useState<WeightUnit>('KG');
  const [value, setValue] = useState<number>(RANGES.KG.default);

  const range = useMemo(() => buildRange(unit), [unit]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await listWeights();
      setWeights(res.weights);
      // Default the ruler + unit to the most recent weigh-in.
      if (res.weights[0]) {
        setUnit(res.weights[0].unit);
        setValue(res.weights[0].weight);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not load your weigh-ins',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    if (weights.length === 0) return null;
    const latest = weights[0];
    const prev = weights.find((w, i) => i > 0 && w.unit === latest.unit);
    const delta = prev ? latest.weight - prev.weight : null;
    return { latest, delta };
  }, [weights]);

  const logWeight = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await logWeightApi({ weight: value, unit });
      trackEvent('weight_logged', { unit });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your weigh-in');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold
      eyebrow="Progress"
      title="Weight"
      subtitle="Slide to your weight and log it. A weekly check-in is plenty — it's the trend over time that matters."
      disclaimer
    >
      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator color="#0e7c7b" />
          <Text className="mt-3 font-sans text-[13px] text-muted">
            Loading your weigh-ins…
          </Text>
        </View>
      ) : (
        <>
          {error ? (
            <View className="mb-4">
              <ErrorRetry message={error} onRetry={load} retrying={loading} />
            </View>
          ) : null}

          {/* Latest summary */}
          {summary ? (
            <View className="rounded-3xl bg-paper p-5" style={elevation.card}>
              <Text className="font-sans-bold text-[11px] uppercase tracking-[2px] text-teal">
                Latest
              </Text>
              <View className="mt-1 flex-row items-end gap-2">
                <Text
                  className="font-display-bold text-[36px] leading-[38px] text-ink"
                  allowFontScaling={false}
                >
                  {summary.latest.weight}
                </Text>
                <Text className="pb-1.5 font-sans-semibold text-[15px] text-muted">
                  {summary.latest.unit.toLowerCase()}
                </Text>
              </View>
              {summary.delta != null ? (
                <Text
                  className={`mt-1 font-sans-semibold text-[13px] ${
                    summary.delta < 0
                      ? 'text-success'
                      : summary.delta > 0
                        ? 'text-warn'
                        : 'text-muted'
                  }`}
                >
                  {summary.delta === 0
                    ? 'No change since last weigh-in'
                    : `${summary.delta > 0 ? '+' : ''}${summary.delta.toFixed(
                        1,
                      )} ${summary.latest.unit.toLowerCase()} since last weigh-in`}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Entry — ruler + unit */}
          <View className="mt-4 rounded-3xl bg-card p-5" style={elevation.card}>
            <View className="flex-row items-center justify-between">
              <Text className="font-sans-bold text-[12px] uppercase tracking-[2px] text-faint">
                Log a weigh-in
              </Text>
              {/* Segmented kg/lb */}
              <View className="flex-row overflow-hidden rounded-xl bg-mist p-0.5">
                {(['KG', 'LB'] as WeightUnit[]).map((u) => {
                  const selected = u === unit;
                  return (
                    <Pressable
                      key={u}
                      onPress={() => {
                        setUnit(u);
                        setValue(RANGES[u].default);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Unit ${u.toLowerCase()}`}
                      className={`rounded-[10px] px-4 py-1.5 ${
                        selected ? 'bg-paper' : ''
                      }`}
                      style={selected ? elevation.card : undefined}
                    >
                      <Text
                        className={`font-sans-bold text-[13px] ${
                          selected ? 'text-teal-deep' : 'text-muted'
                        }`}
                      >
                        {u.toLowerCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="mt-5">
              <Ruler
                values={range}
                value={value}
                onChange={setValue}
                unit={unit.toLowerCase()}
                decimals={1}
              />
            </View>

            <Pressable
              onPress={logWeight}
              disabled={saving}
              accessibilityRole="button"
              accessibilityState={{ disabled: saving }}
              accessibilityLabel="Log weigh-in"
              style={saving ? undefined : elevation.card}
              className={`mt-6 flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
                saving ? 'bg-teal/60' : 'bg-teal active:bg-teal-deep'
              }`}
            >
              {saving ? <ActivityIndicator color="#faf8f3" /> : null}
              <Text className="font-sans-bold text-[15px] uppercase tracking-[1px] text-paper">
                {saving
                  ? 'Saving…'
                  : `Log ${value.toFixed(1)} ${unit.toLowerCase()}`}
              </Text>
            </Pressable>
          </View>

          {/* Recent */}
          {weights.length > 0 ? (
            <View className="mt-9">
              <Text className="font-sans-bold text-[12px] uppercase tracking-[2px] text-faint">
                Recent
              </Text>
              <View className="mt-3.5 gap-2.5">
                {weights.slice(0, 8).map((w) => (
                  <View
                    key={w.id}
                    className="flex-row items-center justify-between rounded-2xl bg-paper px-4 py-3.5"
                    style={elevation.card}
                  >
                    <Text className="font-sans-bold text-[15px] text-ink">
                      {w.weight} {w.unit.toLowerCase()}
                    </Text>
                    <Text className="font-sans text-[12px] text-faint">
                      {formatDate(w.recordedAt)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : !error ? (
            <View className="mt-8">
              <EmptyState
                icon="weight-scale"
                title="No weigh-ins yet"
                body="Slide to your weight above and log it. A weekly check-in is plenty."
              />
            </View>
          ) : null}
        </>
      )}
    </ScreenScaffold>
  );
};

export default Weight;
