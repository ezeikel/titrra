import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';
import { getDrugMeta } from '@/lib/glp1';

const TOTAL = 8;

const DoseStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();
  const meta = data.drug ? getDrugMeta(data.drug) : null;
  const unit = meta?.form === 'ORAL' ? 'mg' : 'mg';

  return (
    <OnboardingStep
      step={3}
      total={TOTAL}
      title={`What dose are you on now${data.name ? `, ${data.name}` : ''}?`}
      subtitle="Pick where you are today. You can fine-tune your ladder later."
      canContinue={data.currentDose != null}
      onContinue={() => router.push('/(onboarding)/goal')}
    >
      <View className="flex-row flex-wrap gap-2">
        {(meta?.doses ?? []).map((d) => {
          const selected = d === data.currentDose;
          return (
            <Pressable
              key={d}
              onPress={() => set({ currentDose: d })}
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
                {d} {unit}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-6 font-sans text-[12px] leading-[17px] text-muted">
        For tracking and education only. Not medical advice — always confirm
        doses with your healthcare provider.
      </Text>
    </OnboardingStep>
  );
};

export default DoseStep;
