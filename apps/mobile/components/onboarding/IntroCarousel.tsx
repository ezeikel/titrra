import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IntroSlide } from '@/components/onboarding/IntroSlide';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { INTRO_SLIDES } from '@/lib/onboarding-intro';

type IntroCarouselProps = {
  // Last slide's primary button + Skip both call this to enter the quiz.
  onComplete: () => void;
};

// Swipeable value-prop carousel shown before the quiz (CC pattern, ported to
// Reanimated 4): horizontal paging ScrollView, live offset-driven progress
// dots, Skip, and a primary button that advances to the next slide then hands
// off to the quiz on the last slide.
export const IntroCarousel = ({ onComplete }: IntroCarouselProps) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const offsetX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const last = index === INTRO_SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    offsetX.value = e.contentOffset.x;
  });

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
    },
    [width],
  );

  // Re-snap on rotation (width change) so the active slide stays centered.
  // Depends on `width` only (NOT index) on purpose — a resnap should fire on
  // rotation, never on every page change (that would fight the user's swipe).
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: index * width, animated: false });
  }, [width]);

  const next = () => {
    if (last) {
      onComplete();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  return (
    <View className="flex-1 bg-sand">
      {/* Skip */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="h-12 flex-row justify-end px-6"
      >
        <Pressable
          onPress={onComplete}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip intro"
          className="px-2 py-1"
        >
          <Text className="font-sans-semibold text-[14px] text-muted">
            Skip
          </Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumEnd}
      >
        {INTRO_SLIDES.map((slide, i) => (
          <IntroSlide
            key={slide.visual}
            slide={slide}
            isActive={i === index}
            index={i}
            offsetX={offsetX}
            pageWidth={width}
          />
        ))}
      </Animated.ScrollView>

      {/* Dots + CTA */}
      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-6 pt-4">
        <View className="mb-5 items-center">
          <ProgressDots
            total={INTRO_SLIDES.length}
            offsetX={offsetX}
            pageWidth={width}
          />
        </View>
        <Pressable
          onPress={next}
          accessibilityRole="button"
          accessibilityLabel={last ? 'Set up my plan' : 'Next'}
          className="items-center rounded-2xl bg-teal px-6 py-4 active:bg-teal-deep"
        >
          <Text className="font-sans-bold text-[16px] uppercase tracking-[1px] text-paper">
            {last ? 'Set up my plan' : 'Next'}
          </Text>
        </Pressable>
        <Text className="mt-4 text-center font-sans text-[12px] text-faint">
          For tracking and education only. Not medical advice.
        </Text>
      </View>
    </View>
  );
};

export default IntroCarousel;
