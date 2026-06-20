import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trackEvent } from '@/lib/analytics';

// Welcome — benefit promise, not a feature list. The emotional hook before any
// questions (the high-converting reference apps all open this way).
const Welcome = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const start = () => {
    trackEvent('onboarding_started');
    router.push('/(onboarding)/name');
  };

  return (
    <View
      className="flex-1 items-center justify-between bg-paper px-6"
      style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 20 }}
    >
      <View className="items-center">
        <Image
          source={require('../../assets/images/icon.png')}
          style={{ width: 84, height: 84, borderRadius: 20 }}
        />
        <Text className="mt-8 text-center font-sans-bold text-[34px] leading-[40px] text-ink">
          Stay on track with{'\n'}every dose.
        </Text>
        <Text className="mt-4 max-w-[300px] text-center font-sans text-[16px] leading-[24px] text-muted">
          The focused tracker for your weight-loss shot — built around your
          routine, not calories. Let&apos;s set up your plan in under a minute.
        </Text>
      </View>

      <View className="w-full">
        <Pressable
          onPress={start}
          className="items-center rounded-2xl bg-teal px-6 py-4 active:bg-teal-deep"
        >
          <Text className="font-sans-bold text-[16px] uppercase tracking-[1px] text-paper">
            Get started
          </Text>
        </Pressable>
        <Text className="mt-4 text-center font-sans text-[12px] text-muted">
          For tracking and education only. Not medical advice.
        </Text>
      </View>
    </View>
  );
};

export default Welcome;
