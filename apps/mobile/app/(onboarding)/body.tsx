import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';
import { trackEvent } from '@/lib/analytics';
import type { BodyShape } from '@/lib/body-shape';

const TOTAL = 8;

// Framed as a neutral visual preference — which figure to show on the 3D
// injection-site map — NOT a clinical or identity question. Skipping keeps the
// neutral default (UNSPECIFIED).
const OPTIONS: { value: BodyShape; label: string; hint: string }[] = [
  { value: 'MALE', label: 'Masculine', hint: 'Broader frame' },
  { value: 'FEMALE', label: 'Feminine', hint: 'Slimmer frame' },
];

const BodyShapeStep = () => {
  const router = useRouter();
  const { data, set } = useOnboarding();
  const next = () => router.push('/(onboarding)/reminders');

  const choose = (value: BodyShape) => {
    set({ bodyShape: value });
    trackEvent('body_shape_set', { value, source: 'onboarding' });
  };

  return (
    <OnboardingStep
      step={7}
      total={TOTAL}
      title="Which body would you like to see?"
      subtitle="We'll show your injection sites on this figure. Purely a visual preference — you can change it any time in Settings."
      onSkip={() => {
        set({ bodyShape: 'UNSPECIFIED' });
        next();
      }}
      canContinue
      continueLabel={data.bodyShape !== 'UNSPECIFIED' ? 'Continue' : 'Skip'}
      onContinue={next}
    >
      <View className="gap-3">
        {OPTIONS.map((o) => {
          const selected = data.bodyShape === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => choose(o.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={o.label}
              className={`flex-row items-center justify-between rounded-2xl border px-5 py-4 ${
                selected
                  ? 'border-teal bg-accent'
                  : 'border-border bg-paper active:bg-mist'
              }`}
            >
              <View>
                {/* Selected card sits on the pale `accent` tint, so the label
                    must be dark teal (not white) to stay legible. */}
                <Text
                  className={`font-sans-semibold text-[16px] ${
                    selected ? 'text-teal-deep' : 'text-ink'
                  }`}
                >
                  {o.label}
                </Text>
                <Text
                  className={`mt-0.5 font-sans text-[13px] ${
                    selected ? 'text-teal-deep/70' : 'text-muted'
                  }`}
                >
                  {o.hint}
                </Text>
              </View>
              <View
                className={`size-6 items-center justify-center rounded-full border-2 ${
                  selected ? 'border-teal bg-teal' : 'border-border'
                }`}
              >
                {selected ? (
                  <View className="size-2.5 rounded-full bg-paper" />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStep>
  );
};

export default BodyShapeStep;
