import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { toast } from 'sonner-native';
import { usePurchases } from '@/contexts/purchases';
import { trackEvent } from '@/lib/analytics';

const PERKS = [
  'Titration ladder + step-up reminders',
  'Medication-level curve between doses',
  'Full weight × dose × side-effect timeline',
  'Export a PDF/CSV for your provider',
  'Protein & water goals',
  'Apple Health / Health Connect sync',
];

// Single clean tier (spec §4): $7.99/mo · $39.99/yr (hero) · $59.99 lifetime.
// No weekly trap, no 10-SKU maze — the honest pricing IS the positioning.
const Paywall = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { monthly, annual, lifetime, purchase } = usePurchases();

  useEffect(() => {
    trackEvent('paywall_viewed', { offering: 'default' });
  }, []);

  const buy = async (pkg: PurchasesPackage | null) => {
    if (!pkg) {
      toast.info('Plans are loading — try again in a moment.');
      return;
    }
    trackEvent('purchase_started', { package: pkg.identifier });
    const ok = await purchase(pkg);
    if (ok) {
      trackEvent('purchase_completed', { package: pkg.identifier });
      toast.success('Welcome to Titrra Pro.');
      router.back();
    }
  };

  const dismiss = () => {
    trackEvent('paywall_dismissed', { offering: 'default' });
    router.back();
  };

  const priceLabel = (pkg: PurchasesPackage | null, fallback: string) =>
    pkg?.product.priceString ?? fallback;

  return (
    <View
      className="flex-1 bg-sand"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-1 px-6">
        <Text className="font-sans-bold text-[11px] uppercase tracking-[3px] text-teal-deep">
          Titrra Pro
        </Text>
        <Text className="mt-3 font-sans-bold text-[30px] leading-[34px] text-ink">
          Your whole journey, on one timeline.
        </Text>

        <View className="mt-6 gap-2">
          {PERKS.map((perk) => (
            <Text key={perk} className="font-sans text-[15px] text-ink">
              · {perk}
            </Text>
          ))}
        </View>

        <View className="mt-auto gap-3">
          <Pressable
            onPress={() => buy(annual)}
            className="rounded-2xl bg-teal px-6 py-4 active:bg-teal-deep"
          >
            <Text className="text-center font-sans-bold text-[16px] text-paper">
              Annual — {priceLabel(annual, '$39.99/yr')}
            </Text>
            <Text className="mt-1 text-center font-sans text-[12px] text-paper/80">
              3-day free trial · best value
            </Text>
          </Pressable>

          <Pressable
            onPress={() => buy(monthly)}
            className="rounded-2xl border border-border bg-paper px-6 py-4 active:opacity-80"
          >
            <Text className="text-center font-sans-semibold text-[15px] text-ink">
              Monthly — {priceLabel(monthly, '$7.99/mo')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => buy(lifetime)}
            className="rounded-2xl border border-border bg-paper px-6 py-4 active:opacity-80"
          >
            <Text className="text-center font-sans-semibold text-[15px] text-ink">
              Lifetime — {priceLabel(lifetime, '$59.99')}
            </Text>
          </Pressable>

          <Pressable onPress={dismiss} className="py-3 active:opacity-70">
            <Text className="text-center font-sans text-[13px] text-muted">
              Not now
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default Paywall;
