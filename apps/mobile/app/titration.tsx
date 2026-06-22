import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorRetry } from '@/components/ErrorRetry';
import { Icon } from '@/components/Icon';
import { ProGate } from '@/components/ProGate';
import { trackEvent } from '@/lib/analytics';
import {
  addStep as addStepApi,
  listSteps,
  startStep as startStepApi,
  type TitrationStepRecord,
} from '@/lib/api';
import { elevation } from '@/lib/elevation';

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
// OKs it. Persists via /api/titration → @titrra/db. Gated behind Titrra Pro
// (the marquee paid feature — see the wrapping default export).
const TitrationLadderContent = () => {
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
      className="flex-1 bg-sand"
      contentContainerStyle={{
        paddingHorizontal: 22,
        paddingTop: 20,
        paddingBottom: insets.bottom + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="font-sans text-[15px] leading-[22px] text-muted">
        Your planned dose schedule, one rung at a time. Mark a rung as started
        once your provider says it&apos;s time to step up.
      </Text>

      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator color="#0e7c7b" />
          <Text className="mt-3 font-sans text-[13px] text-muted">
            Loading your ladder…
          </Text>
        </View>
      ) : (
        <>
          {error ? (
            <View className="mt-4">
              <ErrorRetry message={error} onRetry={load} retrying={busy} />
            </View>
          ) : null}

          {/* The ladder. On a load error we hide the empty/add UI so a failed
              fetch doesn't masquerade as "you have no rungs". */}
          {error ? null : steps.length === 0 ? (
            <View
              className="mt-6 rounded-3xl bg-paper p-6"
              style={elevation.card}
            >
              <Text className="font-display-semibold text-[17px] text-ink">
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
                        className={`size-10 items-center justify-center rounded-full ${
                          isCurrent
                            ? 'bg-teal'
                            : isDone
                              ? 'bg-teal-deep'
                              : 'border-2 border-border bg-paper'
                        }`}
                        style={isCurrent ? elevation.card : undefined}
                      >
                        {isDone ? (
                          <Icon icon="check" size={15} color="#faf8f3" />
                        ) : (
                          <Text
                            className={`font-display-bold text-[14px] ${
                              isCurrent ? 'text-paper' : 'text-faint'
                            }`}
                            allowFontScaling={false}
                          >
                            {i + 1}
                          </Text>
                        )}
                      </View>
                      {!last ? (
                        <View
                          className={`my-1 w-[2px] flex-1 ${
                            isDone ? 'bg-teal-deep' : 'bg-border'
                          }`}
                        />
                      ) : null}
                    </View>

                    {/* Rung card */}
                    <View className="ml-3.5 flex-1 pb-4">
                      <View
                        className={`rounded-2xl p-4 ${
                          isCurrent
                            ? 'border-2 border-teal bg-accent'
                            : 'bg-paper'
                        }`}
                        style={elevation.card}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text
                            className={`font-display-bold text-[22px] ${
                              isUpcoming && !isNext ? 'text-faint' : 'text-ink'
                            }`}
                            allowFontScaling={false}
                          >
                            {step.doseMg} mg
                          </Text>
                          {isCurrent ? (
                            <View className="rounded-full bg-teal px-3 py-1">
                              <Text className="font-sans-bold text-[10px] uppercase tracking-[1px] text-paper">
                                Current
                              </Text>
                            </View>
                          ) : isDone ? (
                            <Text className="font-sans-bold text-[11px] uppercase tracking-[1px] text-teal-deep">
                              Completed
                            </Text>
                          ) : null}
                        </View>

                        {isUpcoming ? (
                          <Pressable
                            onPress={() => startStep(step)}
                            disabled={busy || !isNext}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: busy || !isNext }}
                            accessibilityLabel={
                              isNext
                                ? `Mark ${step.doseMg} milligram rung as started`
                                : `${step.doseMg} milligram rung, upcoming`
                            }
                            className={`mt-3 items-center rounded-xl px-4 py-3 ${
                              isNext
                                ? 'bg-teal active:bg-teal-deep'
                                : 'bg-mist opacity-50'
                            }`}
                          >
                            <Text
                              className={`font-sans-bold text-[13px] uppercase tracking-[1px] ${
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

          {/* Provider-consult prompt — part of the ladder UI, hidden on error. */}
          {error ? null : (
            <View className="mt-2 flex-row items-start gap-2.5 rounded-2xl border border-warn/40 bg-warn/10 p-4">
              <Icon icon="heart-pulse" size={16} color="#c98a2b" />
              <Text className="flex-1 font-sans text-[12px] leading-[17px] text-ink">
                Only step up when your healthcare provider tells you to. Titrra
                tracks your plan — it never recommends a dose change.
              </Text>
            </View>
          )}

          {/* Add a rung — hidden on a load error so the dead Add button doesn't
              imply the feature is broken (retry from the error card instead). */}
          {error ? null : (
            <>
              <Text className="mt-8 font-sans-bold text-[12px] uppercase tracking-[2px] text-faint">
                Add a rung
              </Text>
              <View className="mt-3.5 flex-row flex-wrap gap-2.5">
                {RUNG_OPTIONS.map((d) => {
                  const selected = d === newDose;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setNewDose(d)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Add ${d} milligram rung`}
                      className={`rounded-2xl border-2 px-4 py-2.5 ${
                        selected
                          ? 'border-teal bg-accent'
                          : 'border-border bg-paper active:bg-mist'
                      }`}
                    >
                      <Text
                        className={`font-sans-semibold text-[14px] ${
                          selected ? 'text-teal-deep' : 'text-ink'
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
                accessibilityRole="button"
                accessibilityState={{ disabled: newDose == null || busy }}
                accessibilityLabel={
                  newDose != null
                    ? `Add ${newDose} milligram rung`
                    : 'Pick a dose'
                }
                style={newDose == null || busy ? undefined : elevation.card}
                className={`mt-6 flex-row items-center justify-center gap-2 rounded-2xl px-6 py-4 ${
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
            </>
          )}

          <Text className="mt-8 font-sans text-[11px] leading-[16px] text-muted">
            For tracking and education only. Not medical advice. Titrra never
            recommends a dose change — talk to your healthcare provider.
          </Text>
        </>
      )}
    </ScrollView>
  );
};

// Pro-gated: non-subscribers see the upsell, subscribers see the ladder.
const TitrationLadder = () => (
  <ProGate
    feature="The titration ladder"
    perks={[
      'Visualise your full planned dose schedule',
      'Step-up reminders timed to your schedule',
      'See exactly where you are on your journey',
    ]}
  >
    <TitrationLadderContent />
  </ProGate>
);

export default TitrationLadder;
