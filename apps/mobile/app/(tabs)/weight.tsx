import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { trackEvent } from '@/lib/analytics';
import {
  listWeights,
  logWeight as logWeightApi,
  type WeightRecord,
  type WeightUnit,
} from '@/lib/api';

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const Weight = () => {
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('KG');

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await listWeights();
      setWeights(res.weights);
      // Default the unit picker to whatever the user logged most recently.
      if (res.weights[0]) setUnit(res.weights[0].unit);
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

  // Latest weight + change vs the previous entry in the same unit.
  const summary = useMemo(() => {
    if (weights.length === 0) return null;
    const latest = weights[0];
    const prev = weights.find((w, i) => i > 0 && w.unit === latest.unit);
    const delta = prev ? latest.weight - prev.weight : null;
    return { latest, delta };
  }, [weights]);

  const logWeight = async () => {
    const weight = Number(value);
    if (!Number.isFinite(weight) || weight <= 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      await logWeightApi({ weight, unit });
      trackEvent('weight_logged', { unit });
      setValue('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your weigh-in');
    } finally {
      setSaving(false);
    }
  };

  const canSave = Number(value) > 0 && !saving;

  return (
    <ScreenScaffold
      eyebrow="Progress"
      title="Weight"
      subtitle="Log a weigh-in and watch the trend. A weekly check-in is plenty — it's the number moving over time that matters."
    >
      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator color="#0d9488" />
        </View>
      ) : (
        <>
          {error ? (
            <View className="mb-4 flex-row items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
              <Icon icon="triangle-exclamation" size={16} color="#dc2626" />
              <Text className="flex-1 font-sans text-[13px] leading-[18px] text-ink">
                {error}
              </Text>
            </View>
          ) : null}

          {/* Latest weight summary */}
          {summary ? (
            <View className="rounded-2xl bg-accent p-5">
              <Text className="font-sans-bold text-[11px] uppercase tracking-[2px] text-teal-deep">
                Latest
              </Text>
              <View className="mt-1 flex-row items-end gap-2">
                <Text className="font-sans-bold text-[34px] leading-[36px] text-ink">
                  {summary.latest.weight}
                </Text>
                <Text className="pb-1 font-sans-semibold text-[15px] text-muted">
                  {summary.latest.unit.toLowerCase()}
                </Text>
              </View>
              {summary.delta != null ? (
                <Text className="mt-1 font-sans text-[13px] text-muted">
                  {summary.delta === 0
                    ? 'No change since last weigh-in'
                    : `${summary.delta > 0 ? '+' : ''}${summary.delta.toFixed(
                        1,
                      )} ${summary.latest.unit.toLowerCase()} since last weigh-in`}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Entry */}
          <Text className="mt-7 font-sans-semibold text-[13px] uppercase tracking-[2px] text-muted">
            Log a weigh-in
          </Text>
          <View className="mt-3 flex-row items-center gap-3">
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="0.0"
              placeholderTextColor="#9aa8a6"
              keyboardType="decimal-pad"
              className="h-14 flex-1 rounded-xl border border-border bg-sand px-4 font-sans-bold text-[20px] text-ink"
            />
            <View className="flex-row overflow-hidden rounded-xl border border-border">
              {(['KG', 'LB'] as WeightUnit[]).map((u) => {
                const selected = u === unit;
                return (
                  <Pressable
                    key={u}
                    onPress={() => setUnit(u)}
                    className={`px-5 py-4 ${selected ? 'bg-teal' : 'bg-sand'}`}
                  >
                    <Text
                      className={`font-sans-bold text-[14px] ${
                        selected ? 'text-paper' : 'text-muted'
                      }`}
                    >
                      {u.toLowerCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={logWeight}
            disabled={!canSave}
            className={`mt-5 flex-row items-center justify-center gap-2 rounded-2xl px-6 py-4 ${
              canSave ? 'bg-teal active:bg-teal-deep' : 'bg-teal/50'
            }`}
          >
            {saving ? <ActivityIndicator color="#faf8f3" /> : null}
            <Text className="font-sans-bold text-[15px] uppercase tracking-[1px] text-paper">
              {saving ? 'Saving…' : 'Log weigh-in'}
            </Text>
          </Pressable>

          {/* Recent */}
          {weights.length > 0 ? (
            <View className="mt-8">
              <Text className="font-sans-semibold text-[13px] uppercase tracking-[2px] text-muted">
                Recent
              </Text>
              <View className="mt-3 gap-2">
                {weights.slice(0, 8).map((w) => (
                  <View
                    key={w.id}
                    className="flex-row items-center justify-between rounded-xl border border-border bg-sand px-4 py-3"
                  >
                    <Text className="font-sans-semibold text-[15px] text-ink">
                      {w.weight} {w.unit.toLowerCase()}
                    </Text>
                    <Text className="font-sans text-[12px] text-muted">
                      {formatDate(w.recordedAt)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </ScreenScaffold>
  );
};

export default Weight;
