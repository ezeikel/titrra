import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';
import type { SideEffectType } from '@/lib/api';

const TOTAL = 8;

const OPTIONS: { type: SideEffectType; label: string }[] = [
  { type: 'NAUSEA', label: 'Nausea' },
  { type: 'CONSTIPATION', label: 'Constipation' },
  { type: 'DIARRHEA', label: 'Diarrhea' },
  { type: 'FATIGUE', label: 'Fatigue' },
  { type: 'REFLUX', label: 'Reflux' },
  { type: 'HEADACHE', label: 'Headache' },
];

// Multi-select empathy step — seeds the side-effects habit + makes the app feel
// like it gets their experience. All optional.
const SideEffectsStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();
  const next = () => router.push('/(onboarding)/reminders');

  const toggle = (type: SideEffectType) => {
    const has = data.sideEffects.includes(type);
    set({
      sideEffects: has
        ? data.sideEffects.filter((t) => t !== type)
        : [...data.sideEffects, type],
    });
  };

  return (
    <OnboardingStep
      step={6}
      total={TOTAL}
      title="Dealing with any of these?"
      subtitle="Tap any you've felt lately — we'll start tracking them so you can spot patterns. Optional."
      onSkip={next}
      canContinue
      continueLabel={
        data.sideEffects.length > 0 ? 'Continue' : 'None right now'
      }
      onContinue={next}
    >
      <View className="flex-row flex-wrap gap-2">
        {OPTIONS.map((o) => {
          const selected = data.sideEffects.includes(o.type);
          return (
            <Pressable
              key={o.type}
              onPress={() => toggle(o.type)}
              className={`rounded-full border px-4 py-2.5 ${
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
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStep>
  );
};

export default SideEffectsStep;
