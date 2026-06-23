import { useEffect, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Icon } from '@/components/Icon';
import { usePurchases } from '@/contexts/purchases';
import { elevation } from '@/lib/elevation';
import type { IntroSlideData } from '@/lib/onboarding-intro';

type IntroSlideProps = {
  slide: IntroSlideData;
  isActive: boolean;
  // Position of this slide + the live scroll offset, so the slide can scale +
  // fade as a function of its distance from the centered position.
  index: number;
  offsetX: SharedValue<number>;
  pageWidth: number;
};

// One value-prop slide: a product-anchored hero visual + Bricolage headline +
// subtitle. Two layers of motion: (1) a one-shot entrance fade when the slide
// first becomes active (CC `hasBeenActive` lifecycle, doesn't replay on
// swipe-back), and (2) a subtle scroll-coupled scale + fade so off-center
// slides recede slightly as you swipe — a calm "card deck" feel that suits the
// premium-health tone (gentler than CC's playful values).
export const IntroSlide = ({
  slide,
  isActive,
  index,
  offsetX,
  pageWidth,
}: IntroSlideProps) => {
  const { width } = useWindowDimensions();
  const [seen, setSeen] = useState(isActive);
  useEffect(() => {
    if (isActive) setSeen(true);
  }, [isActive]);

  // Scroll-coupled transform: at rest (centered) scale 1 / opacity 1; one page
  // away, scale 0.92 / opacity 0.4. Clamped so far slides don't over-shrink.
  const scrollStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * pageWidth,
      index * pageWidth,
      (index + 1) * pageWidth,
    ];
    const scale = interpolate(
      offsetX.value,
      inputRange,
      [0.92, 1, 0.92],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      offsetX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }], opacity };
  });

  return (
    <Animated.View style={[{ width }, scrollStyle]} className="flex-1 px-7">
      <View className="flex-1 items-center justify-center">
        {seen ? (
          <Animated.View
            entering={FadeIn.duration(600)}
            className="w-full items-center"
          >
            <Hero slide={slide} />
          </Animated.View>
        ) : (
          <View className="w-full items-center opacity-0">
            <Hero slide={slide} />
          </View>
        )}
      </View>

      <View className="pb-2">
        {seen ? (
          <Animated.View entering={FadeIn.duration(600).delay(180)}>
            <Text
              className="font-display-bold text-[32px] leading-[38px] text-ink"
              allowFontScaling={false}
            >
              {slide.title}
            </Text>
            <Text className="mt-3.5 font-sans text-[16px] leading-[24px] text-muted">
              {slide.subtitle}
            </Text>
          </Animated.View>
        ) : (
          <View className="opacity-0">
            <Text className="font-display-bold text-[32px] leading-[38px]">
              {slide.title}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// ── Product-anchored hero visuals (built from the design system, no assets) ──

const Hero = ({ slide }: { slide: IntroSlideData }) => {
  switch (slide.visual) {
    case 'rotation':
      return <RotationHero />;
    case 'ladder':
      return <LadderHero />;
    case 'pricing':
      return <PricingHero />;
    default:
      return <DoseHero />;
  }
};

// A clean "log this dose" card — the core action.
const DoseHero = () => (
  <View
    className="w-full max-w-[300px] rounded-3xl bg-paper p-6"
    style={elevation.raised}
  >
    <View className="flex-row items-center gap-3">
      <View className="size-14 items-center justify-center rounded-2xl bg-accent">
        <Icon icon="syringe" size={24} color="#0e7c7b" />
      </View>
      <View className="flex-1">
        <Text className="font-sans-bold text-[11px] uppercase tracking-[2px] text-teal">
          This week's shot
        </Text>
        <Text className="mt-0.5 font-display-bold text-[20px] text-ink">
          5 mg · Belly · left
        </Text>
      </View>
    </View>
    <View className="mt-5 items-center rounded-2xl bg-teal py-4">
      <Text className="font-sans-bold text-[14px] uppercase tracking-[1px] text-paper">
        Logged in one tap
      </Text>
    </View>
  </View>
);

const SITES = [
  ['Belly · L', true],
  ['Belly · R', false],
  ['Thigh · L', false],
  ['Thigh · R', false],
  ['Arm · L', false],
  ['Arm · R', false],
] as const;

const RotationHero = () => (
  <View
    className="w-full max-w-[300px] rounded-3xl bg-paper p-6"
    style={elevation.raised}
  >
    <Text className="font-sans-bold text-[11px] uppercase tracking-[2px] text-teal">
      Suggested next site
    </Text>
    <View className="mt-3 flex-row flex-wrap gap-2">
      {SITES.map(([label, on]) => (
        <View
          key={label}
          className={`rounded-xl border-2 px-3 py-2 ${
            on ? 'border-teal bg-accent' : 'border-border bg-paper'
          }`}
        >
          <Text
            className={`font-sans-semibold text-[12px] ${
              on ? 'text-teal-deep' : 'text-faint'
            }`}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

const RUNGS = ['2.5', '5', '7.5', '10', '15'];
const LadderHero = () => (
  <View
    className="w-full max-w-[300px] rounded-3xl bg-paper p-6"
    style={elevation.raised}
  >
    <Text className="font-sans-bold text-[11px] uppercase tracking-[2px] text-teal">
      Your titration ladder
    </Text>
    <View className="mt-4 flex-row items-center justify-between">
      {RUNGS.map((r, i) => (
        <View key={r} className="flex-row items-center">
          <View
            className={`items-center justify-center rounded-xl px-2.5 py-2 ${
              i === 1 ? 'bg-teal' : 'bg-mist'
            }`}
          >
            <Text
              className={`font-display-bold text-[14px] ${
                i === 1 ? 'text-paper' : 'text-muted'
              }`}
              allowFontScaling={false}
            >
              {r}
            </Text>
          </View>
          {i < RUNGS.length - 1 ? (
            <Text className="px-0.5 font-sans-bold text-[12px] text-teal">
              →
            </Text>
          ) : null}
        </View>
      ))}
    </View>
    <Text className="mt-3 font-sans text-[12px] text-muted">
      Starting at 5 mg, goal 15 mg.
    </Text>
  </View>
);

// Fallback prices (US English) shown only until RevenueCat's locale-aware
// prices load — or in the dev variant where RC is intentionally inert. In
// preview/production the real localized `priceString` (£/€/$ per the user's
// App Store region) replaces these, so a non-US user never sees a wrong symbol.
const PLAN_FALLBACKS = [
  { label: 'Monthly', fallback: '$7.99' },
  { label: 'Annual', fallback: '$39.99' },
  { label: 'Lifetime', fallback: '$59.99' },
] as const;

const PricingHero = () => {
  const { monthly, annual, lifetime } = usePurchases();
  // Map each row to the live RC priceString when available, else the fallback.
  const prices: Record<string, string> = {
    Monthly: monthly?.product.priceString ?? PLAN_FALLBACKS[0].fallback,
    Annual: annual?.product.priceString ?? PLAN_FALLBACKS[1].fallback,
    Lifetime: lifetime?.product.priceString ?? PLAN_FALLBACKS[2].fallback,
  };

  return (
    <View
      className="w-full max-w-[300px] rounded-3xl bg-paper p-6"
      style={elevation.raised}
    >
      <Text className="font-sans-bold text-[11px] uppercase tracking-[2px] text-teal">
        One simple plan
      </Text>
      <View className="mt-3 gap-2">
        {PLAN_FALLBACKS.map(({ label }, i) => (
          <View
            key={label}
            className={`flex-row items-center justify-between rounded-xl px-4 py-2.5 ${
              i === 1 ? 'bg-accent' : 'bg-mist'
            }`}
          >
            <Text className="font-sans-semibold text-[13px] text-ink">
              {label}
            </Text>
            <Text className="font-sans-bold text-[13px] text-teal-deep">
              {prices[label]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default IntroSlide;
