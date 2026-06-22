import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
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
      let committed = true;
      try {
        await commit();
      } catch (err) {
        // The atomic commit rolled back — nothing partial was saved. Carry the
        // failure to the reveal so it can offer a Retry instead of pretending
        // everything saved.
        console.error('[onboarding] commit failed', err);
        committed = false;
        toast.error(
          "We couldn't save your plan. You can retry on the next screen.",
        );
      }
      // Keep the loader up for at least ~2s so it feels considered.
      const elapsed = Date.now() - started;
      const wait = Math.max(0, 2000 - elapsed);
      setTimeout(() => {
        clearInterval(ticker);
        router.replace({
          pathname: '/(onboarding)/reveal',
          params: committed ? {} : { commitFailed: '1' },
        });
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
