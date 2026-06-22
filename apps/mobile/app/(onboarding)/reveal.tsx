import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorRetry } from '@/components/ErrorRetry';
import { Icon } from '@/components/Icon';
import { useOnboarding } from '@/contexts/onboarding';
import { getDrugMeta } from '@/lib/glp1';

// Value reveal — the earned payoff. Recaps their real plan (drug, ladder, goal)
// then hands off to the paywall at peak motivation.
const RevealStep = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { commitFailed } = useLocalSearchParams<{ commitFailed?: string }>();
  const { data, commit } = useOnboarding();
  const meta = data.drug ? getDrugMeta(data.drug) : null;

  // If the atomic commit failed during the loader, let the user retry here.
  const [saveFailed, setSaveFailed] = useState(commitFailed === '1');
  const [retrying, setRetrying] = useState(false);

  const retrySave = async () => {
    setRetrying(true);
    try {
      await commit();
      setSaveFailed(false);
    } catch {
      // stays failed — banner remains with the retry
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
    <View className="flex-1 bg-paper">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 32,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="size-14 items-center justify-center rounded-2xl bg-teal">
          <Icon icon="chart-line" size={26} color="#faf8f3" />
        </View>
        <Text className="mt-6 font-sans-bold text-[30px] leading-[34px] text-ink">
          {data.name ? `${data.name}, your` : 'Your'} Titrra plan is ready.
        </Text>
        <Text className="mt-3 font-sans text-[15px] leading-[22px] text-muted">
          Here&apos;s what we set up for you. Everything&apos;s editable any
          time.
        </Text>

        {saveFailed ? (
          <View className="mt-5">
            <ErrorRetry
              message="We couldn't save your plan to your account. Your answers are shown below — tap to save them."
              onRetry={retrySave}
              retrying={retrying}
            />
          </View>
        ) : null}

        {/* Recap cards */}
        <View className="mt-7 gap-3">
          {meta ? (
            <View className="rounded-2xl border border-border bg-sand p-5">
              <Text className="font-sans-bold text-[11px] uppercase tracking-[2px] text-teal-deep">
                Your medication
              </Text>
              <Text className="mt-1 font-sans-bold text-[20px] text-ink">
                {meta.label}
              </Text>
              <Text className="mt-0.5 font-sans text-[13px] text-muted">
                {meta.scheduleType === 'WEEKLY' ? 'Weekly' : 'Daily'} ·{' '}
                {meta.form === 'INJECTION' ? 'Injection' : 'Pill'}
              </Text>
            </View>
          ) : null}

          {ladder.length > 0 ? (
            <View className="rounded-2xl border border-border bg-sand p-5">
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
              <Text className="mt-3 font-sans text-[13px] text-muted">
                Starting at {data.currentDose} mg
                {data.goalDose ? `, goal ${data.goalDose} mg` : ''}.
              </Text>
            </View>
          ) : null}

          {data.currentWeight != null ? (
            <View className="rounded-2xl border border-border bg-sand p-5">
              <Text className="font-sans-bold text-[11px] uppercase tracking-[2px] text-teal-deep">
                Starting weight
              </Text>
              <Text className="mt-1 font-sans-bold text-[20px] text-ink">
                {data.currentWeight} {data.weightUnit.toLowerCase()}
              </Text>
            </View>
          ) : null}
        </View>

        <Text className="mt-6 font-sans text-[11px] leading-[16px] text-muted">
          For tracking and education only. Not medical advice. Your plan
          reflects what you told us — confirm doses with your provider.
        </Text>
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 12 }} className="px-5 pt-3">
        <Pressable
          onPress={() => router.replace('/paywall')}
          accessibilityRole="button"
          accessibilityLabel="See my plan"
          className="items-center rounded-2xl bg-teal px-6 py-4 active:bg-teal-deep"
        >
          <Text className="font-sans-bold text-[16px] uppercase tracking-[1px] text-paper">
            See my plan
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default RevealStep;
