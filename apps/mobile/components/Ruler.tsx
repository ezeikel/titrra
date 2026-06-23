import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

type RulerProps = {
  // Discrete, ordered values the ruler snaps between (e.g. a drug's dose rungs).
  values: number[];
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  // Decimals to show on the big readout (doses can be 2.5, weight 82.5).
  decimals?: number;
};

const TICK_GAP = 18; // px between ticks
// A tick is "major" (tall + labelled) on whole numbers; half-steps (x.5) render
// as short, unlabelled minor ticks. This keeps a fine 0.5 scroll resolution
// without cramming/​overlapping every label (which made "71.5" wrap).
const isMajorValue = (v: number) => Number.isInteger(v);

// Horizontal drag-ruler for picking a value by sliding (Me+/Cal AI/Noom
// pattern) — far lower friction than scanning a grid of chips. Snaps to the
// provided discrete values, big display-font numeral above, haptic tick on
// each new value. Center pointer marks the selection.
export const Ruler = ({
  values,
  value,
  onChange,
  unit,
  decimals = 1,
}: RulerProps) => {
  const { width } = useWindowDimensions();
  const sidePad = width / 2;
  const scrollRef = useRef<ScrollView>(null);
  const lastIndex = useRef<number>(Math.max(0, values.indexOf(value)));

  // Keep the ruler positioned on the current value (and when it changes
  // externally, e.g. smart default loads).
  useEffect(() => {
    const idx = Math.max(0, values.indexOf(value));
    scrollRef.current?.scrollTo({ x: idx * TICK_GAP, animated: false });
    lastIndex.current = idx;
  }, [value, values]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.min(
        values.length - 1,
        Math.max(0, Math.round(x / TICK_GAP)),
      );
      if (idx !== lastIndex.current) {
        lastIndex.current = idx;
        Haptics.selectionAsync();
        onChange(values[idx]);
      }
    },
    [values, onChange],
  );

  return (
    <View className="items-center">
      {/* Big readout */}
      <View className="mb-3 flex-row items-end gap-1.5">
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
      </View>

      {/* Ruler track */}
      <View className="relative w-full">
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_GAP}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: sidePad - 11 }}
        >
          {values.map((v) => {
            const isMajor = isMajorValue(v);
            const selected = v === value;
            return (
              <View
                key={v}
                style={{ width: TICK_GAP }}
                className="items-center"
              >
                <View
                  className={`w-[2px] rounded-full ${
                    selected ? 'bg-teal' : 'bg-border'
                  }`}
                  style={{ height: isMajor ? 34 : 18 }}
                />
                {/* Label only whole-number ticks. The label can be wider than
                    the 18px tick gap, so it overflows its cell on a single line,
                    centered on the tick, instead of wrapping. */}
                {isMajor ? (
                  <Text
                    numberOfLines={1}
                    style={{ width: 40, marginLeft: (40 - TICK_GAP) / -2 }}
                    className={`mt-1.5 text-center text-[11px] ${
                      selected
                        ? 'font-sans-bold text-teal'
                        : 'font-sans text-faint'
                    }`}
                    allowFontScaling={false}
                  >
                    {v}
                  </Text>
                ) : (
                  // Reserve the label row height so major/minor ticks align.
                  <View className="mt-1.5 h-[14px]" />
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Center pointer */}
        <View
          pointerEvents="none"
          className="absolute top-0 left-1/2 h-[34px] w-[3px] -ml-[1.5px] rounded-full bg-teal-deep"
        />
      </View>
    </View>
  );
};

export default Ruler;
