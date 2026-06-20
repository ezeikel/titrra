import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useOnboarding } from '@/contexts/onboarding';
import { trackEvent } from '@/lib/analytics';

const TOTAL = 8;

const RemindersStep = () => {
  const router = useRouter();
  const { set } = useOnboarding();
  const [asking, setAsking] = useState(false);
  const next = () => router.push('/(onboarding)/building');

  // Request notification permission IN CONTEXT (after they opt in) — far
  // higher grant rate than a cold system prompt at launch.
  const enable = async () => {
    setAsking(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      set({ remindersOptIn: granted });
      trackEvent('reminder_set', { granted });
    } catch {
      set({ remindersOptIn: false });
    } finally {
      setAsking(false);
      next();
    }
  };

  return (
    <OnboardingStep
      step={7}
      total={TOTAL}
      title="Want a nudge on shot day?"
      subtitle="A gentle reminder so your dose never sneaks up on you. You can change this any time."
      onSkip={() => {
        set({ remindersOptIn: false });
        next();
      }}
      canContinue={!asking}
      continueLabel={asking ? 'Just a sec…' : 'Turn on reminders'}
      onContinue={enable}
    >
      <View className="rounded-2xl border border-border bg-sand p-5">
        <View className="flex-row items-center gap-3">
          <View className="size-11 items-center justify-center rounded-xl bg-accent">
            <Icon icon="syringe" size={20} />
          </View>
          <View className="flex-1">
            <Text className="font-sans-semibold text-[15px] text-ink">
              Shot day reminders
            </Text>
            <Text className="mt-0.5 font-sans text-[13px] text-muted">
              On your schedule, never spammy.
            </Text>
          </View>
        </View>
      </View>
      <Pressable
        onPress={() => {
          set({ remindersOptIn: false });
          next();
        }}
        className="mt-4 items-center py-2"
      >
        <Text className="font-sans-semibold text-[14px] text-muted">
          Maybe later
        </Text>
      </Pressable>
    </OnboardingStep>
  );
};

export default RemindersStep;
