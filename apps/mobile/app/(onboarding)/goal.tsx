import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';
import { getDrugMeta } from '@/lib/glp1';

const TOTAL = 8;

const GoalStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();
  const meta = data.drug ? getDrugMeta(data.drug) : null;

  // Only doses at or above the current dose are valid goal targets.
  const goalOptions = useMemo(
    () =>
      (meta?.doses ?? []).filter(
        (d) => data.currentDose == null || d >= data.currentDose,
      ),
    [meta, data.currentDose],
  );

  // The ladder preview — their actual titration steps from current → goal.
  const ladder = useMemo(() => {
    if (data.currentDose == null || data.goalDose == null) return [];
    return (meta?.doses ?? []).filter(
      (d) => d >= data.currentDose! && d <= data.goalDose!,
    );
  }, [meta, data.currentDose, data.goalDose]);

  return (
    <OnboardingStep
      step={4}
      total={TOTAL}
      title="Where are you headed?"
      subtitle="Pick your target dose and we'll map your titration ladder."
      canContinue={data.goalDose != null}
      onContinue={() => router.push('/(onboarding)/weight')}
    >
      <View className="flex-row flex-wrap gap-2">
        {goalOptions.map((d) => {
          const selected = d === data.goalDose;
          return (
            <Pressable
              key={d}
              onPress={() => set({ goalDose: d })}
              className={`rounded-xl border px-5 py-3 ${
                selected
                  ? 'border-teal bg-teal'
                  : 'border-border bg-sand active:bg-mist'
              }`}
            >
              <Text
                className={`font-sans-bold text-[16px] ${
                  selected ? 'text-paper' : 'text-ink'
                }`}
              >
                {d} mg
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Live ladder preview — the "aha": their real plan appears. */}
      {ladder.length > 0 ? (
        <View className="mt-7 rounded-2xl bg-accent p-5">
          <Text className="font-sans-bold text-[11px] uppercase tracking-[2px] text-teal-deep">
            Your titration ladder
          </Text>
          <View className="mt-3 flex-row flex-wrap items-center gap-x-1 gap-y-2">
            {ladder.map((d, i) => (
              <View key={d} className="flex-row items-center">
                <View
                  className={`rounded-lg px-3 py-1.5 ${
                    d === data.currentDose ? 'bg-teal' : 'bg-paper'
                  }`}
                >
                  <Text
                    className={`font-sans-bold text-[14px] ${
                      d === data.currentDose ? 'text-paper' : 'text-ink'
                    }`}
                  >
                    {d}
                  </Text>
                </View>
                {i < ladder.length - 1 ? (
                  <Text className="px-1 font-sans-bold text-[13px] text-teal-deep">
                    →
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
          <Text className="mt-3 font-sans text-[13px] leading-[18px] text-muted">
            {ladder.length} steps, starting at {data.currentDose} mg. We&apos;ll
            remind you when it&apos;s time to talk to your provider about
            stepping up.
          </Text>
        </View>
      ) : null}
    </OnboardingStep>
  );
};

export default GoalStep;
