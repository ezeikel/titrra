import { useRouter } from 'expo-router';
import { TextInput } from 'react-native';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';

const TOTAL = 8;

const NameStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();

  return (
    <OnboardingStep
      step={1}
      total={TOTAL}
      title="First, what should we call you?"
      subtitle="We'll use it to keep things personal — nothing more."
      canContinue={data.name.trim().length > 0}
      onContinue={() => router.push('/(onboarding)/medication')}
    >
      <TextInput
        value={data.name}
        onChangeText={(t) => set({ name: t })}
        placeholder="Your name"
        placeholderTextColor="#93a09d"
        autoFocus
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => {
          if (data.name.trim()) router.push('/(onboarding)/medication');
        }}
        className="h-14 rounded-2xl border-2 border-border bg-paper px-4 font-sans-bold text-[20px] text-ink"
      />
    </OnboardingStep>
  );
};

export default NameStep;
