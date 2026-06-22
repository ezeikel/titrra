import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ErrorRetry } from '@/components/ErrorRetry';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { trackEvent } from '@/lib/analytics';
import {
  listSideEffects,
  logSideEffect as logSideEffectApi,
  type SideEffectRecord,
  type SideEffectType,
} from '@/lib/api';

const TYPES: { type: SideEffectType; label: string }[] = [
  { type: 'NAUSEA', label: 'Nausea' },
  { type: 'CONSTIPATION', label: 'Constipation' },
  { type: 'DIARRHEA', label: 'Diarrhea' },
  { type: 'FATIGUE', label: 'Fatigue' },
  { type: 'REFLUX', label: 'Reflux' },
  { type: 'HEADACHE', label: 'Headache' },
  { type: 'INJECTION_SITE_REACTION', label: 'Injection site' },
  { type: 'OTHER', label: 'Other' },
];

const TYPE_LABELS = Object.fromEntries(
  TYPES.map((t) => [t.type, t.label]),
) as Record<SideEffectType, string>;

const SEVERITY_LABELS = ['Mild', '', 'Moderate', '', 'Severe'];

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const SideEffects = () => {
  const [logs, setLogs] = useState<SideEffectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<SideEffectType | null>(null);
  const [severity, setSeverity] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await listSideEffects();
      setLogs(res.sideEffects);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const logSideEffect = async () => {
    if (type == null || severity == null || saving) return;
    setSaving(true);
    setError(null);
    try {
      await logSideEffectApi({
        type,
        severity,
        notes: notes.trim() || undefined,
      });
      trackEvent('side_effect_logged', { type, severity });
      setType(null);
      setSeverity(null);
      setNotes('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your log');
    } finally {
      setSaving(false);
    }
  };

  const canSave = type != null && severity != null && !saving;

  return (
    <ScreenScaffold
      eyebrow="Wellbeing"
      title="Side effects"
      subtitle="Log how you're feeling — type, severity and when. See how it tracks against your dose and titration changes."
      disclaimer
    >
      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator color="#0d9488" />
          <Text className="mt-3 font-sans text-[13px] text-muted">
            Loading your logs…
          </Text>
        </View>
      ) : (
        <>
          {error ? (
            <View className="mb-4">
              <ErrorRetry message={error} onRetry={load} retrying={loading} />
            </View>
          ) : null}

          {/* Type picker */}
          <Text className="font-sans-semibold text-[13px] uppercase tracking-[2px] text-muted">
            What are you feeling?
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {TYPES.map((t) => {
              const selected = t.type === type;
              return (
                <Pressable
                  key={t.type}
                  onPress={() => setType(t.type)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t.label}
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
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Severity */}
          <Text className="mt-7 font-sans-semibold text-[13px] uppercase tracking-[2px] text-muted">
            How severe?
          </Text>
          <View className="mt-3 flex-row gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const selected = n === severity;
              return (
                <Pressable
                  key={n}
                  onPress={() => setSeverity(n)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Severity ${n}${
                    SEVERITY_LABELS[n - 1] ? `, ${SEVERITY_LABELS[n - 1]}` : ''
                  }`}
                  className={`flex-1 items-center rounded-xl border py-3 ${
                    selected
                      ? 'border-teal bg-teal'
                      : 'border-border bg-sand active:bg-mist'
                  }`}
                >
                  <Text
                    className={`font-sans-bold text-[18px] ${
                      selected ? 'text-paper' : 'text-ink'
                    }`}
                  >
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {severity != null && SEVERITY_LABELS[severity - 1] ? (
            <Text className="mt-2 font-sans text-[13px] text-muted">
              {SEVERITY_LABELS[severity - 1]}
            </Text>
          ) : null}

          {/* Notes */}
          <Text className="mt-7 font-sans-semibold text-[13px] uppercase tracking-[2px] text-muted">
            Notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything worth remembering…"
            placeholderTextColor="#9aa8a6"
            multiline
            className="mt-3 min-h-[64px] rounded-xl border border-border bg-sand px-4 py-3 font-sans text-[15px] text-ink"
          />

          <Pressable
            onPress={logSideEffect}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
            accessibilityLabel="Log side effect"
            className={`mt-5 flex-row items-center justify-center gap-2 rounded-2xl px-6 py-4 ${
              canSave ? 'bg-teal active:bg-teal-deep' : 'bg-teal/50'
            }`}
          >
            {saving ? <ActivityIndicator color="#faf8f3" /> : null}
            <Text className="font-sans-bold text-[15px] uppercase tracking-[1px] text-paper">
              {saving ? 'Saving…' : 'Log side effect'}
            </Text>
          </Pressable>

          {/* Recent */}
          {logs.length > 0 ? (
            <View className="mt-8">
              <Text className="font-sans-semibold text-[13px] uppercase tracking-[2px] text-muted">
                Recent
              </Text>
              <View className="mt-3 gap-2">
                {logs.slice(0, 8).map((l) => (
                  <View
                    key={l.id}
                    className="rounded-xl border border-border bg-sand px-4 py-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="font-sans-semibold text-[15px] text-ink">
                        {TYPE_LABELS[l.type]}
                        <Text className="font-sans text-[13px] text-muted">
                          {'  ·  '}severity {l.severity}
                        </Text>
                      </Text>
                      <Text className="font-sans text-[12px] text-muted">
                        {formatDate(l.occurredAt)}
                      </Text>
                    </View>
                    {l.notes ? (
                      <Text className="mt-1 font-sans text-[13px] leading-[18px] text-muted">
                        {l.notes}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : !error ? (
            <View className="mt-8">
              <EmptyState
                icon="heart-pulse"
                title="No side effects logged"
                body="Log how you're feeling above. Over time you'll spot patterns against your dose and titration changes."
              />
            </View>
          ) : null}
        </>
      )}
    </ScreenScaffold>
  );
};

export default SideEffects;
