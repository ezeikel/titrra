import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { trackEvent } from '@/lib/analytics';
import {
  addStep as addStepApi,
  listSteps,
  startStep as startStepApi,
  type TitrationStepRecord,
} from '@/lib/api';

// Common GLP-1 ladder rungs to quick-add (mg). Covers the standard
// semaglutide and tirzepatide escalation doses.
const RUNG_OPTIONS = [0.25, 0.5, 1, 1.7, 2, 2.4, 2.5, 5, 7.5, 10, 12.5, 15];

// The current rung = highest-order step with an actualStartDate. Steps after it
// are upcoming; steps before it are completed.
const currentRungOrder = (steps: TitrationStepRecord[]): number | null => {
  const started = steps.filter((s) => s.actualStartDate != null);
  if (started.length === 0) return null;
  return Math.max(...started.map((s) => s.order));
};

// Titration ladder — the namesake feature. Visualise the dose-escalation plan,
// see the current rung, add steps, and mark a step as started once a provider
// OKs it. Persists via /api/titration → @titrra/db.
const TitrationLadder = () => {
  const insets = useSafeAreaInsets();
  const [steps, setSteps] = useState<TitrationStepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newDose, setNewDose] = useState<number | null>(null);

  const currentOrder = useMemo(() => currentRungOrder(steps), [steps]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await listSteps();
      setSteps(res.steps);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your ladder');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addStep = async () => {
    if (newDose == null || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addStepApi({ doseMg: newDose });
      trackEvent('titration_step_added', { doseMg: newDose });
      setNewDose(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the step');
    } finally {
      setBusy(false);
    }
  };

  const startStep = async (step: TitrationStepRecord) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await startStepApi(step.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the step');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-paper"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: insets.bottom + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="font-sans text-[15px] leading-[22px] text-muted">
        Your dose-escalation plan, one rung at a time. Mark a rung as started
        once your provider says it&apos;s time to step up.
      </Text>

      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator color="#0d9488" />
        </View>
      ) : (
        <>
          {error ? (
            <View className="mt-4 flex-row items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
              <Icon icon="triangle-exclamation" size={16} color="#dc2626" />
              <Text className="flex-1 font-sans text-[13px] leading-[18px] text-ink">
                {error}
              </Text>
            </View>
          ) : null}

          {/* The ladder */}
          {steps.length === 0 ? (
            <View className="mt-6 rounded-2xl border border-border bg-sand p-6">
              <Text className="font-sans-semibold text-[15px] text-ink">
                No rungs yet
              </Text>
              <Text className="mt-2 font-sans text-[13px] leading-[19px] text-muted">
                Add the doses in your plan below — for example 2.5 → 5 → 7.5 →
                10 mg — to start building your ladder.
              </Text>
            </View>
          ) : (
            <View className="mt-6">
              {steps.map((step, i) => {
                const isCurrent = step.order === currentOrder;
                const isDone =
                  currentOrder != null &&
                  step.actualStartDate != null &&
                  step.order < currentOrder;
                const isUpcoming =
                  currentOrder == null || step.order > currentOrder;
                const isNext =
                  currentOrder != null && step.order === currentOrder + 1;
                const last = i === steps.length - 1;

                return (
                  <View key={step.id} className="flex-row">
                    {/* Rail + node */}
                    <View className="items-center">
                      <View
                        className={`size-9 items-center justify-center rounded-full ${
                          isCurrent
                            ? 'bg-teal'
                            : isDone
                              ? 'bg-teal-deep'
                              : 'border border-border bg-sand'
                        }`}
                      >
                        {isDone ? (
                          <Icon
                            icon="chevron-right"
                            size={14}
                            color="#faf8f3"
                          />
                        ) : (
                          <Text
                            className={`font-sans-bold text-[13px] ${
                              isCurrent ? 'text-paper' : 'text-muted'
                            }`}
                          >
                            {i + 1}
                          </Text>
                        )}
                      </View>
                      {!last ? (
                        <View className="my-1 w-[2px] flex-1 bg-border" />
                      ) : null}
                    </View>

                    {/* Rung card */}
                    <View className="ml-3 flex-1 pb-4">
                      <View
                        className={`rounded-2xl border p-4 ${
                          isCurrent
                            ? 'border-teal bg-accent'
                            : 'border-border bg-sand'
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="font-sans-bold text-[20px] text-ink">
                            {step.doseMg} mg
                          </Text>
                          {isCurrent ? (
                            <View className="rounded-full bg-teal px-3 py-1">
                              <Text className="font-sans-bold text-[10px] uppercase tracking-[1px] text-paper">
                                Current
                              </Text>
                            </View>
                          ) : isDone ? (
                            <Text className="font-sans text-[11px] uppercase tracking-[1px] text-teal-deep">
                              Completed
                            </Text>
                          ) : null}
                        </View>

                        {isUpcoming ? (
                          <Pressable
                            onPress={() => startStep(step)}
                            disabled={busy || !isNext}
                            className={`mt-3 items-center rounded-xl px-4 py-2.5 ${
                              isNext ? 'bg-teal active:bg-teal-deep' : 'bg-mist'
                            }`}
                          >
                            <Text
                              className={`font-sans-semibold text-[13px] ${
                                isNext ? 'text-paper' : 'text-muted'
                              }`}
                            >
                              {isNext ? 'Mark as started' : 'Upcoming'}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Provider-consult prompt */}
          <View className="mt-2 flex-row items-start gap-2 rounded-xl border border-warn/40 bg-warn/10 p-4">
            <Icon icon="heart-pulse" size={16} color="#d97706" />
            <Text className="flex-1 font-sans text-[12px] leading-[17px] text-ink">
              Only step up when your healthcare provider tells you to. Titrra
              tracks your plan — it never recommends a dose change.
            </Text>
          </View>

          {/* Add a rung */}
          <Text className="mt-8 font-sans-semibold text-[13px] uppercase tracking-[2px] text-muted">
            Add a rung
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {RUNG_OPTIONS.map((d) => {
              const selected = d === newDose;
              return (
                <Pressable
                  key={d}
                  onPress={() => setNewDose(d)}
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

          <Pressable
            onPress={addStep}
            disabled={newDose == null || busy}
            className={`mt-5 flex-row items-center justify-center gap-2 rounded-2xl px-6 py-4 ${
              newDose == null || busy
                ? 'bg-teal/50'
                : 'bg-teal active:bg-teal-deep'
            }`}
          >
            {busy ? <ActivityIndicator color="#faf8f3" /> : null}
            <Text className="font-sans-bold text-[15px] uppercase tracking-[1px] text-paper">
              {newDose != null ? `Add ${newDose} mg rung` : 'Pick a dose'}
            </Text>
          </Pressable>

          <Text className="mt-8 font-sans text-[11px] leading-[16px] text-muted">
            For tracking and education only. Not medical advice. Titrra never
            recommends a dose change — talk to your healthcare provider.
          </Text>
        </>
      )}
    </ScrollView>
  );
};

export default TitrationLadder;
