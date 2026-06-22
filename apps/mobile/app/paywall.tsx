import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { ErrorRetry } from '@/components/ErrorRetry';
import { Icon } from '@/components/Icon';
import { useOnboarding } from '@/contexts/onboarding';
import { usePurchases } from '@/contexts/purchases';
import { trackEvent } from '@/lib/analytics';

const PERKS = [
  'Titration ladder + step-up reminders',
  'Medication-level curve between doses',
  'Full weight × dose × side-effect timeline',
  'Export a PDF for your provider',
  'Protein & water goals',
  'Apple Health sync',
];

const TIMELINE = [
  {
    icon: 'chevron-right',
    title: 'Today',
    body: 'Unlock your full plan instantly.',
  },
  {
    icon: 'chevron-right',
    title: 'Day 5',
    body: "We'll remind you before your trial ends.",
  },
  {
    icon: 'chevron-right',
    title: 'Day 7',
    body: 'Your subscription starts. Cancel anytime before.',
  },
] as const;

type PlanKey = 'annual' | 'monthly' | 'lifetime';

// Single clean tier (spec §4): $7.99/mo · $39.99/yr (hero, 3-day trial) ·
// $59.99 lifetime. No weekly trap, no 10-SKU maze — honest pricing IS the
// positioning. This screen is the end of onboarding: dismissing or purchasing
// marks onboarding complete so the entry gate lets the user into the app.
const Paywall = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { monthly, annual, lifetime, purchase, restore, ready, error, retry } =
    usePurchases();
  const { onboarded, markOnboarded } = useOnboarding();
  const [selected, setSelected] = useState<PlanKey>('annual');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    trackEvent('paywall_viewed', { offering: 'default' });
  }, []);

  const pkgFor = (key: PlanKey): PurchasesPackage | null =>
    key === 'annual' ? annual : key === 'monthly' ? monthly : lifetime;

  // Leaving onboarding (whether they bought or not) must complete it so the
  // gate routes into the tabs. No-op if we reached the paywall from elsewhere.
  const finish = async () => {
    if (onboarded === false) await markOnboarded();
  };

  const buy = async () => {
    const pkg = pkgFor(selected);
    if (!pkg) {
      toast.info('Plans are loading — try again in a moment.');
      return;
    }
    setBusy(true);
    trackEvent('purchase_started', { package: pkg.identifier });
    try {
      const result = await purchase(pkg);
      if (result.ok) {
        trackEvent('purchase_completed', { package: pkg.identifier });
        toast.success('Welcome to Titrra Pro.');
        await finish();
        router.replace('/(tabs)');
      } else if (result.cancelled) {
        trackEvent('purchase_cancelled', { package: pkg.identifier });
      } else {
        // A real failure (network, store error) — tell the user so the button
        // re-enabling doesn't read as a silent no-op.
        toast.error('Purchase failed. Check your connection and try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    setBusy(true);
    try {
      const ok = await restore();
      if (ok) {
        toast.success('Purchases restored.');
        await finish();
        router.replace('/(tabs)');
      } else {
        toast.info('No purchases to restore.');
      }
    } finally {
      setBusy(false);
    }
  };

  const dismiss = async () => {
    trackEvent('paywall_dismissed', { offering: 'default' });
    await finish();
    router.replace('/(tabs)');
  };

  const priceLabel = (key: PlanKey, fallback: string) =>
    pkgFor(key)?.product.priceString ?? fallback;

  // Plan-specific CTA — "Continue" is ambiguous for monthly/lifetime (browse vs
  // buy), so name the action.
  const ctaLabel =
    selected === 'annual'
      ? 'Start free trial'
      : selected === 'lifetime'
        ? 'Unlock lifetime'
        : 'Subscribe monthly';

  const PlanRow = ({
    plan,
    title,
    price,
    note,
    badge,
  }: {
    plan: PlanKey;
    title: string;
    price: string;
    note?: string;
    badge?: string;
  }) => {
    const active = selected === plan;
    return (
      <Pressable
        onPress={() => setSelected(plan)}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`${title} plan, ${price}${note ? `, ${note}` : ''}`}
        className={`flex-row items-center justify-between rounded-2xl border-2 px-5 py-4 ${
          active ? 'border-teal bg-accent' : 'border-border bg-paper'
        }`}
      >
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-sans-bold text-[16px] text-ink">{title}</Text>
            {badge ? (
              <View className="rounded-full bg-teal px-2 py-0.5">
                <Text className="font-sans-bold text-[9px] uppercase tracking-[1px] text-paper">
                  {badge}
                </Text>
              </View>
            ) : null}
          </View>
          {note ? (
            <Text className="mt-0.5 font-sans text-[12px] text-muted">
              {note}
            </Text>
          ) : null}
        </View>
        <Text className="font-sans-bold text-[15px] text-ink">{price}</Text>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-sand">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-sans-bold text-[11px] uppercase tracking-[3px] text-teal-deep">
          Titrra Pro
        </Text>
        <Text className="mt-3 font-sans-bold text-[28px] leading-[32px] text-ink">
          Your whole journey, on one timeline.
        </Text>

        <View className="mt-5 gap-1.5">
          {PERKS.map((perk) => (
            <View key={perk} className="flex-row items-center gap-2">
              <Icon icon="chevron-right" size={13} color="#0d9488" />
              <Text className="font-sans text-[14px] text-ink">{perk}</Text>
            </View>
          ))}
        </View>

        {/* Trial timeline */}
        <View className="mt-6 rounded-2xl border border-border bg-paper p-5">
          {TIMELINE.map((t, i) => (
            <View key={t.title} className="flex-row gap-3">
              <View className="items-center">
                <View className="size-7 items-center justify-center rounded-full bg-accent">
                  <Icon icon="chevron-right" size={13} color="#0f766e" />
                </View>
                {i < TIMELINE.length - 1 ? (
                  <View className="my-1 w-[2px] flex-1 bg-border" />
                ) : null}
              </View>
              <View className={i < TIMELINE.length - 1 ? 'pb-4' : ''}>
                <Text className="font-sans-bold text-[14px] text-ink">
                  {t.title}
                </Text>
                <Text className="mt-0.5 font-sans text-[13px] text-muted">
                  {t.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View className="mt-6 gap-3">
          <PlanRow
            plan="annual"
            title="Annual"
            price={priceLabel('annual', '$39.99/yr')}
            note="3-day free trial, then billed yearly"
            badge="Best value"
          />
          <PlanRow
            plan="monthly"
            title="Monthly"
            price={priceLabel('monthly', '$7.99/mo')}
          />
          <PlanRow
            plan="lifetime"
            title="Lifetime"
            price={priceLabel('lifetime', '$59.99')}
            note="One payment, yours forever"
          />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="border-t border-border/60 bg-sand px-6 pt-3"
      >
        {error ? (
          // Bootstrap failed — show a retry instead of a permanently dead CTA.
          <ErrorRetry
            message="We couldn't load the plans. Check your connection and try again."
            onRetry={retry}
            retrying={!ready}
          />
        ) : !ready ? (
          // Offerings still loading — say so rather than a greyed-out mystery.
          <View className="flex-row items-center justify-center gap-2 rounded-2xl bg-teal/50 px-6 py-4">
            <ActivityIndicator color="#faf8f3" />
            <Text className="font-sans-bold text-[16px] uppercase tracking-[1px] text-paper">
              Loading plans…
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={buy}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            accessibilityLabel={ctaLabel}
            className={`items-center rounded-2xl px-6 py-4 ${
              busy ? 'bg-teal/50' : 'bg-teal active:bg-teal-deep'
            }`}
          >
            <Text className="font-sans-bold text-[16px] uppercase tracking-[1px] text-paper">
              {ctaLabel}
            </Text>
          </Pressable>
        )}
        <View className="mt-2 flex-row items-center justify-center gap-6">
          <Pressable
            onPress={onRestore}
            hitSlop={16}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Restore previous purchases"
            className="px-2 py-1"
          >
            <Text className="font-sans text-[13px] text-muted">Restore</Text>
          </Pressable>
          <Pressable
            onPress={dismiss}
            hitSlop={16}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
            className="px-2 py-1"
          >
            <Text className="font-sans text-[13px] text-muted">
              Maybe later
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default Paywall;
