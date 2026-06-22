import { View } from 'react-native';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { TIMING_DOT } from '@/lib/motion';

type ProgressDotsProps = {
  total: number;
  /** Index-driven mode (quiz steps). The active dot grows. */
  activeIndex?: number;
  /** Offset-driven mode (carousel) — scroll x + page width drive interpolation. */
  offsetX?: SharedValue<number>;
  pageWidth?: number;
};

const ACTIVE_W = 22;
const DOT_W = 6;

// Animated progress dots — the active dot stretches into a pill. Shared by the
// quiz (index-driven, animates on step change) and the intro carousel
// (offset-driven, animates live during the swipe). House timing from lib/motion.
export const ProgressDots = ({
  total,
  activeIndex = 0,
  offsetX,
  pageWidth = 1,
}: ProgressDotsProps) => (
  <View className="flex-row items-center gap-1.5">
    {Array.from({ length: total }).map((_, i) => (
      <Dot
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length static dots
        key={i}
        index={i}
        activeIndex={activeIndex}
        offsetX={offsetX}
        pageWidth={pageWidth}
      />
    ))}
  </View>
);

const Dot = ({
  index,
  activeIndex,
  offsetX,
  pageWidth,
}: {
  index: number;
  activeIndex: number;
  offsetX?: SharedValue<number>;
  pageWidth: number;
}) => {
  // Continuous "page position" — from the live scroll offset if provided,
  // otherwise snapped to the active index.
  const page = useDerivedValue(() =>
    offsetX ? offsetX.value / pageWidth : withTiming(activeIndex, TIMING_DOT),
  );

  const style = useAnimatedStyle(() => {
    const dist = Math.abs(page.value - index);
    const t = Math.max(0, 1 - dist); // 1 at this dot, 0 one page away
    return {
      width: interpolate(t, [0, 1], [DOT_W, ACTIVE_W]),
      opacity: interpolate(t, [0, 1], [0.35, 1]),
    };
  });

  return <Animated.View className="h-1.5 rounded-full bg-teal" style={style} />;
};

export default ProgressDots;
