import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorRetry } from '@/components/ErrorRetry';
import { Icon } from '@/components/Icon';
import { usePurchases } from '@/contexts/purchases';
import { trackEvent } from '@/lib/analytics';

type ProGateProps = {
  // What's locked, shown on the upsell card (e.g. "the titration ladder").
  feature: string;
  // Short benefit lines for the locked state.
  perks?: string[];
  children: ReactNode;
};

// Wrap any Pro-only screen body. Non-subscribers see a clean upsell that routes
// to /paywall; subscribers see the real content. While the customer-info fetch
// is in flight we show a spinner so we never flash the locked state at a Pro.
export const ProGate = ({ feature, perks, children }: ProGateProps) => {
  const { isPro, ready, error, retry } = usePurchases();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator color="#0d9488" />
        <Text className="mt-3 font-sans text-[13px] text-muted">
          Loading your plan…
        </Text>
      </View>
    );
  }

  // Bootstrap failed/timed out — don't wrongly show the upsell to a Pro user or
  // trap them behind a dead screen. Offer a Retry.
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-paper px-8">
        <ErrorRetry
          message="We couldn't verify your subscription. Check your connection and try again."
          onRetry={retry}
        />
      </View>
    );
  }

  if (isPro) return <>{children}</>;

  return (
    <ScrollView
      className="flex-1 bg-paper"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: insets.bottom + 24,
        flexGrow: 1,
        justifyContent: 'center',
      }}
    >
      <View className="items-center">
        <View className="size-16 items-center justify-center rounded-2xl bg-accent">
          <Icon icon="chart-line" size={28} />
        </View>
        <Text className="mt-6 text-center font-sans-bold text-[24px] leading-[30px] text-ink">
          {feature} is part of Titrra Pro
        </Text>
        <Text className="mt-3 text-center font-sans text-[15px] leading-[22px] text-muted">
          Unlock it — plus your full history, provider exports and more — with
          one simple plan.
        </Text>
      </View>

      {perks && perks.length > 0 ? (
        <View className="mt-7 gap-2">
          {perks.map((p) => (
            <View key={p} className="flex-row items-center gap-2">
              <Icon icon="chevron-right" size={13} color="#0d9488" />
              <Text className="font-sans text-[14px] text-ink">{p}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          trackEvent('paywall_viewed', { source: `gate:${feature}` });
          router.push('/paywall');
        }}
        accessibilityRole="button"
        accessibilityLabel="See Titrra Pro plans"
        className="mt-8 items-center rounded-2xl bg-teal px-6 py-4 active:bg-teal-deep"
      >
        <Text className="font-sans-bold text-[16px] uppercase tracking-[1px] text-paper">
          See Titrra Pro
        </Text>
      </Pressable>
    </ScrollView>
  );
};

export default ProGate;
