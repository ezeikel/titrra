import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Icon } from '@/components/Icon';
import { SPRING_BOUNCE, SPRING_SETTLE } from '@/lib/motion';

type StepperProps = {
  // Discrete ordered rungs to step between (e.g. a drug's dose ladder).
  values: number[];
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  decimals?: number;
};

// +/- stepper over a discrete ladder — the right pattern for dose, where the
// mental model IS "step up/down a rung". Big springy numeral as the hero
// (Alma / How We Feel pattern), round buttons either side, haptics, snaps to
// real rungs so an invalid dose is impossible. Ends disable at the bounds.
export const Stepper = ({
  values,
  value,
  onChange,
  unit,
  decimals = 1,
}: StepperProps) => {
  const idx = Math.max(0, values.indexOf(value));
  const atMin = idx <= 0;
  const atMax = idx >= values.length - 1;

  // Springy bounce on the numeral whenever the value changes.
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.12, SPRING_BOUNCE),
      withSpring(1, SPRING_SETTLE),
    );
  }, [value]);
  const numStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const step = (dir: 1 | -1) => {
    const next = idx + dir;
    if (next < 0 || next > values.length - 1) return;
    Haptics.selectionAsync();
    onChange(values[next]);
  };

  const Btn = ({ dir, disabled }: { dir: 1 | -1; disabled: boolean }) => (
    <Pressable
      onPress={() => step(dir)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={dir === 1 ? 'Increase dose' : 'Decrease dose'}
      className={`size-14 items-center justify-center rounded-full border-2 ${
        disabled
          ? 'border-border bg-mist opacity-40'
          : 'border-teal bg-paper active:bg-accent'
      }`}
    >
      <Icon
        icon={dir === 1 ? 'plus' : 'minus'}
        size={20}
        color={disabled ? '#93a09d' : '#0e7c7b'}
      />
    </Pressable>
  );

  return (
    <View className="flex-row items-center justify-between">
      <Btn dir={-1} disabled={atMin} />

      <Animated.View style={numStyle} className="flex-row items-end gap-1.5">
        <Text
          className="font-display-bold text-[44px] leading-[46px] text-ink"
          allowFontScaling={false}
        >
          {value.toFixed(decimals)}
        </Text>
        {unit ? (
          <Text className="pb-2 font-sans-semibold text-[16px] text-muted">
            {unit}
          </Text>
        ) : null}
      </Animated.View>

      <Btn dir={1} disabled={atMax} />
    </View>
  );
};

export default Stepper;
