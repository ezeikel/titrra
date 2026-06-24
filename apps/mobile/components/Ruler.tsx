import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
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
  // The ruler lives inside a padded card, so its track is NARROWER than the
  // screen. The side padding (which centers tick 0 under the pointer) MUST be
  // half the TRACK width, not half the screen — using the screen width offsets
  // the selected tick from the centre pointer. Measure the track on layout.
  const [trackWidth, setTrackWidth] = useState(0);
  const sidePad = trackWidth > 0 ? trackWidth / 2 - TICK_GAP / 2 : 0;
  const scrollRef = useRef<ScrollView>(null);
  // The index the user is currently parked on (updated live by onScroll). Used
  // to detect whether a `value` prop change originated from the user's own
  // drag (skip repositioning) vs. an external change (reposition).
  const dragIndex = useRef<number>(Math.max(0, values.indexOf(value)));
  // True while the user is actively touching/scrolling the ruler — during which
  // we must NEVER programmatically scrollTo (it fights the finger → lag).
  const isDragging = useRef(false);

  // Whether we've done the one-time initial positioning yet. The first scroll
  // must wait until the ScrollView content is actually measured (there can be
  // hundreds of ticks) — onContentSizeChange is the reliable signal for that;
  // an effect + requestAnimationFrame races the layout and lands short.
  const didInitialScroll = useRef(false);

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  // Scroll the current value under the centre pointer. Bails while the user is
  // dragging (we must never fight the finger) — that's the scroll lag.
  const scrollToValue = useCallback(
    (animated: boolean) => {
      if (isDragging.current) return;
      const idx = Math.max(0, values.indexOf(value));
      dragIndex.current = idx;
      scrollRef.current?.scrollTo({ x: idx * TICK_GAP, animated });
    },
    [value, values],
  );

  // Initial position needs BOTH the track measured (so sidePad is set) AND the
  // content sized (so the target offset isn't clamped). These two layout events
  // can arrive in either order, so we attempt the initial scroll from each and
  // only succeed once both are ready (guarded by didInitialScroll + trackWidth).
  const tryInitialScroll = useCallback(() => {
    if (didInitialScroll.current || trackWidth === 0) return;
    didInitialScroll.current = true;
    // A short timeout (not just rAF) so the Fabric/New-Arch ScrollView's native
    // node is fully laid out before we seek — an immediate/rAF scrollTo is a
    // no-op there and leaves the ruler stuck at offset 0.
    setTimeout(() => scrollToValue(false), 0);
  }, [trackWidth, scrollToValue]);

  const onContentSizeChange = useCallback(() => {
    tryInitialScroll();
  }, [tryInitialScroll]);

  // Also attempt once the track width arrives (covers the order where content
  // sized before the track was measured, so onContentSizeChange bailed).
  useEffect(() => {
    tryInitialScroll();
  }, [tryInitialScroll]);

  // Reposition on EXTERNAL value changes (smart-default load, unit switch) —
  // but skip if we're already parked on this index (the value changed *because*
  // of the user's own scroll, so re-scrolling would stutter) or mid-drag.
  useEffect(() => {
    if (!didInitialScroll.current || isDragging.current) return;
    const idx = Math.max(0, values.indexOf(value));
    if (idx === dragIndex.current) return;
    scrollToValue(false);
  }, [value, values, scrollToValue]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.min(
        values.length - 1,
        Math.max(0, Math.round(x / TICK_GAP)),
      );
      if (idx !== dragIndex.current) {
        dragIndex.current = idx;
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
      <View className="relative w-full" onLayout={onTrackLayout}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_GAP}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          // Mount-time position (Fabric honors this even when an early
          // scrollTo() no-ops). Later changes are handled by the effects.
          contentOffset={{
            x: Math.max(0, values.indexOf(value)) * TICK_GAP,
            y: 0,
          }}
          onContentSizeChange={onContentSizeChange}
          // Suppress the external-reposition effect while the user owns the
          // scroll position (begin drag → end of momentum), so it never fights
          // the finger.
          onScrollBeginDrag={() => {
            isDragging.current = true;
          }}
          onScrollEndDrag={() => {
            isDragging.current = false;
          }}
          onMomentumScrollEnd={() => {
            isDragging.current = false;
          }}
          contentContainerStyle={{ paddingHorizontal: sidePad }}
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
