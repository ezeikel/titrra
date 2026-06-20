import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { useOnboarding } from '@/contexts/onboarding';
import { trackEvent } from '@/lib/analytics';

const STEPS = [
  'Saving your medication…',
  'Mapping your titration ladder…',
  'Setting up your plan…',
];

// The loader. Manufactures anticipation (every reference app does this) AND is
// where the real batch commit() to the server happens — so the wait is real
// work, not theater.
const BuildingStep = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { commit } = useOnboarding();
  const [label, setLabel] = useState(STEPS[0]);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let i = 0;
    const ticker = setInterval(() => {
      i = Math.min(i + 1, STEPS.length - 1);
      setLabel(STEPS[i]);
    }, 700);

    const run = async () => {
      const started = Date.now();
      try {
        await commit();
      } catch {
        // Non-fatal — the reveal still shows the plan from local answers, and
        // the user can re-log anything that didn't persist.
      }
      // Keep the loader up for at least ~2s so it feels considered.
      const elapsed = Date.now() - started;
      const wait = Math.max(0, 2000 - elapsed);
      setTimeout(() => {
        clearInterval(ticker);
        router.replace('/(onboarding)/reveal');
      }, wait);
    };
    run();

    return () => clearInterval(ticker);
  }, [commit, router]);

  // trackEvent on mount (separate effect so the commit effect stays single-run).
  useEffect(() => {
    trackEvent('onboarding_completed');
  }, []);

  return (
    <View
      className="flex-1 items-center justify-center bg-paper px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="size-16 items-center justify-center rounded-2xl bg-accent">
        <Icon icon="chart-line" size={28} />
      </View>
      <ActivityIndicator color="#0d9488" className="mt-8" />
      <Text className="mt-5 font-sans-semibold text-[16px] text-ink">
        {label}
      </Text>
    </View>
  );
};

export default BuildingStep;
