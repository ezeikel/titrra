import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { ErrorRetry } from '@/components/ErrorRetry';
import { Icon } from '@/components/Icon';
import { PaywallHero } from '@/components/paywall/PaywallHero';
import { PlanRow } from '@/components/paywall/PlanRow';
import { TrustStrip } from '@/components/paywall/TrustStrip';
import { useOnboarding } from '@/contexts/onboarding';
import { usePurchases } from '@/contexts/purchases';
import { trackEvent } from '@/lib/analytics';
import { elevation } from '@/lib/elevation';
import { TIMING_RISE } from '@/lib/motion';
import { PAYWALL_PERKS, PAYWALL_TIMELINE } from '@/lib/paywall';

type PlanKey = 'annual' | 'monthly' | 'lifetime';

// Apple Guideline 3.1.2(c): apps with auto-renewable subscriptions must show
// functional Terms of Use (EULA) + Privacy Policy links INSIDE the app's
// purchase flow (not just in App Store metadata). Canonical www host — the
// apex 308-redirects (see lib/api.ts).
const TERMS_URL = 'https://www.titrra.com/terms';
const PRIVACY_URL = 'https://www.titrra.com/privacy';

// Single clean tier (spec §4): $7.99/mo · $39.99/yr (hero, 3-day trial) ·
// $59.99 lifetime. No weekly trap, no 10-SKU maze — honest pricing IS the
// positioning. This screen is the end of onboarding: dismissing or purchasing
// marks onboarding complete so the entry gate lets the user into the app.
const Paywall = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { monthly, annual, lifetime, purchase, restore, ready, error, retry } =
    usePurchases();
  const { data, onboarded, markOnboarded } = useOnboarding();
  const [selected, setSelected] = useState<PlanKey>('annual');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    trackEvent('paywall_viewed', { offering: 'default' });
  }, []);

  // Body fade + rise after the hero springs in.
  const bodyOpacity = useSharedValue(0);
  const bodyY = useSharedValue(18);
  useEffect(() => {
    bodyOpacity.value = withDelay(220, withTiming(1, TIMING_RISE));
    bodyY.value = withDelay(
      220,
      withTiming(0, { ...TIMING_RISE, easing: Easing.out(Easing.cubic) }),
    );
  }, [bodyOpacity, bodyY]);
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: bodyOpacity.value,
    transform: [{ translateY: bodyY.value }],
  }));

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

  return (
    <View className="flex-1 bg-sand">
      {/* Top-right close — mirrors the dismiss CTA */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="absolute right-5 z-10"
      >
        <Pressable
          onPress={dismiss}
          hitSlop={14}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="size-9 items-center justify-center rounded-full bg-paper"
          style={elevation.card}
        >
          <Icon icon="xmark" size={16} color="#5f706e" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — the titration ladder fan */}
        <PaywallHero currentDose={data.currentDose} goalDose={data.goalDose} />

        <Animated.View style={bodyStyle}>
          <Text className="mt-4 text-center font-sans-bold text-[11px] uppercase tracking-[3px] text-teal">
            Titrra Pro
          </Text>
          <Text className="mt-2 text-center font-display-bold text-[28px] leading-[33px] text-ink">
            Your whole journey, on one timeline.
          </Text>

          {/* Trust */}
          <View className="mt-4">
            <TrustStrip />
          </View>

          {/* Perks card */}
          <View
            className="mt-6 rounded-3xl bg-paper p-5"
            style={elevation.card}
          >
            <View className="gap-2.5">
              {PAYWALL_PERKS.map((perk) => (
                <View key={perk} className="flex-row items-center gap-2.5">
                  <View className="size-5 items-center justify-center rounded-full bg-accent">
                    <Icon icon="check" size={11} color="#0e7c7b" />
                  </View>
                  <Text className="flex-1 font-sans text-[14px] text-ink">
                    {perk}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Trial timeline */}
          <View
            className="mt-4 rounded-3xl bg-paper p-5"
            style={elevation.card}
          >
            {PAYWALL_TIMELINE.map((t, i) => (
              <View key={t.title} className="flex-row gap-3">
                <View className="items-center">
                  <View className="size-7 items-center justify-center rounded-full bg-accent">
                    <Text className="font-sans-bold text-[11px] text-teal-deep">
                      {i + 1}
                    </Text>
                  </View>
                  {i < PAYWALL_TIMELINE.length - 1 ? (
                    <View className="my-1 w-[2px] flex-1 bg-border" />
                  ) : null}
                </View>
                <View className={i < PAYWALL_TIMELINE.length - 1 ? 'pb-4' : ''}>
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
          <View className="mt-5 gap-3">
            <PlanRow
              title="Annual"
              price={priceLabel('annual', '$39.99/yr')}
              note="3-day free trial, then billed yearly"
              badge="Best value"
              selected={selected === 'annual'}
              onPress={() => setSelected('annual')}
            />
            <PlanRow
              title="Monthly"
              price={priceLabel('monthly', '$7.99/mo')}
              selected={selected === 'monthly'}
              onPress={() => setSelected('monthly')}
            />
            <PlanRow
              title="Lifetime"
              price={priceLabel('lifetime', '$59.99')}
              note="One payment, yours forever"
              selected={selected === 'lifetime'}
              onPress={() => setSelected('lifetime')}
            />
          </View>
        </Animated.View>
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

        {/* Microcopy + auto-renew compliance line */}
        <Text className="mt-2.5 text-center font-sans text-[11px] leading-[15px] text-faint">
          {selected === 'annual'
            ? `3-day free trial, then ${priceLabel('annual', '$39.99')}/yr. `
            : selected === 'lifetime'
              ? 'One payment, yours forever. '
              : `${priceLabel('monthly', '$7.99')}/mo. `}
          Cancel anytime in Settings. For tracking and education only — not
          medical advice.
        </Text>

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

        {/* Required by App Store Guideline 3.1.2(c): functional Terms of Use
            (EULA) + Privacy Policy links in the purchase flow. */}
        <View className="mt-2 flex-row items-center justify-center gap-5">
          <Pressable
            onPress={() => Linking.openURL(TERMS_URL)}
            hitSlop={12}
            accessibilityRole="link"
            accessibilityLabel="Terms of Use"
            className="px-2 py-1"
          >
            <Text className="font-sans text-[11px] text-faint underline">
              Terms of Use
            </Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL(PRIVACY_URL)}
            hitSlop={12}
            accessibilityRole="link"
            accessibilityLabel="Privacy Policy"
            className="px-2 py-1"
          >
            <Text className="font-sans text-[11px] text-faint underline">
              Privacy Policy
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default Paywall;
