import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '@/components/Icon';
import { elevation } from '@/lib/elevation';
import { SPRING_ENTRY } from '@/lib/motion';

type PaywallHeroProps = {
  // Optionally personalize the centre rung from onboarding context.
  currentDose?: number | null;
  goalDose?: number | null;
};

// Three "ladder rung" cards fanned like the reveal screen's ladder — the
// product's core metaphor as the paywall anchor ("look what you unlock"). The
// wings spring in staggered after the centre (CC entrance choreography). No
// photos; built from the design system so it works pre-personalization.
const Card = ({
  children,
  rotate,
  translateX,
  scale,
  delay,
  fill,
}: {
  children: React.ReactNode;
  rotate: string;
  translateX: number;
  scale: number;
  delay: number;
  fill?: boolean;
}) => {
  const s = useSharedValue(0.7);
  const o = useSharedValue(0);
  useEffect(() => {
    s.value = withDelay(delay, withSpring(scale, SPRING_ENTRY));
    o.value = withDelay(delay, withTiming(1, { duration: 280 }));
  }, [s, o, scale, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateX }, { rotate }, { scale: s.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 132,
          height: 132,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: '#e6e2d8',
          alignItems: 'center',
          justifyContent: 'center',
        },
        fill ? { backgroundColor: '#0e7c7b' } : { backgroundColor: '#ffffff' },
        elevation.raised,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export const PaywallHero = ({ currentDose, goalDose }: PaywallHeroProps) => {
  const now = currentDose ?? 0.5;
  const goal = goalDose ?? 2.4;
  const prev = currentDose ? Math.max(0, currentDose - 0.5) : 0.25;

  return (
    <View className="h-44 w-full items-center justify-center">
      {/* Left wing — a lower/previous rung */}
      <Card rotate="-9deg" translateX={-76} scale={0.82} delay={120}>
        <Text className="font-display-bold text-[26px] text-ink">{prev}</Text>
        <Text className="font-sans-semibold text-[12px] text-faint">mg</Text>
      </Card>

      {/* Right wing — the goal rung */}
      <Card rotate="9deg" translateX={76} scale={0.82} delay={120}>
        <Icon icon="chevron-up" size={16} color="#0e7c7b" />
        <Text className="mt-1 font-display-bold text-[26px] text-ink">
          {goal}
        </Text>
        <Text className="font-sans-bold text-[9px] uppercase tracking-[1px] text-teal">
          goal
        </Text>
      </Card>

      {/* Centre — current rung, on top */}
      <Card rotate="0deg" translateX={0} scale={1} delay={0} fill>
        <Text className="font-display-black text-[34px] text-paper">{now}</Text>
        <Text className="font-sans-semibold text-[13px] text-paper/80">mg</Text>
        <View className="mt-1 rounded-full bg-paper/20 px-2.5 py-0.5">
          <Text className="font-sans-bold text-[9px] uppercase tracking-[1px] text-paper">
            now
          </Text>
        </View>
      </Card>
    </View>
  );
};

export default PaywallHero;
