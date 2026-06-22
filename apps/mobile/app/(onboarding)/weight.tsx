import { useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';
import type { WeightUnit } from '@/lib/api';

const TOTAL = 7;

const WeightStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();
  const next = () => router.push('/(onboarding)/side-effects');
  const skip = () => {
    set({ currentWeight: null });
    next();
  };

  return (
    <OnboardingStep
      step={5}
      total={TOTAL}
      title="What's your starting weight?"
      subtitle="Optional — it sets the baseline for your progress. You can skip this."
      onSkip={skip}
      canContinue
      continueLabel={data.currentWeight != null ? 'Continue' : 'Skip for now'}
      onContinue={data.currentWeight != null ? next : skip}
    >
      <View className="flex-row items-center gap-3">
        <TextInput
          value={data.currentWeight != null ? String(data.currentWeight) : ''}
          onChangeText={(t) => {
            const n = Number(t);
            set({ currentWeight: t && Number.isFinite(n) && n > 0 ? n : null });
          }}
          placeholder="0.0"
          placeholderTextColor="#93a09d"
          keyboardType="decimal-pad"
          className="h-14 flex-1 rounded-2xl border-2 border-border bg-paper px-4 font-sans-bold text-[20px] text-ink"
        />
        <View className="flex-row overflow-hidden rounded-2xl border border-border">
          {(['KG', 'LB'] as WeightUnit[]).map((u) => {
            const selected = u === data.weightUnit;
            return (
              <Pressable
                key={u}
                onPress={() => set({ weightUnit: u })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Unit ${u.toLowerCase()}`}
                className={`px-5 py-4 ${selected ? 'bg-teal' : 'bg-paper'}`}
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
    </OnboardingStep>
  );
};

export default WeightStep;
