import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { elevation } from '@/lib/elevation';

// Minimal shape of the props expo-router's <Tabs tabBar={...}> passes. Typed
// locally to avoid a direct dep on @react-navigation/bottom-tabs (transitive
// only under pnpm's strict isolation — same approach as chunky-crayon).
type TabRoute = { key: string; name: string };
export type GlassTabBarProps = {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: boolean;
    }) => { defaultPrevented: boolean };
  };
};

// Floating translucent (glass) tab bar — content shows softly through a blur,
// matching the chunky-crayon BlurView pattern + TIDE / Apple News look. Five
// evenly-spaced destinations; active = brand teal, inactive = muted. Replaces
// the default opaque bottom bar (docs/DESIGN-SYSTEM.md §3).

const TEAL = '#0e7c7b';
const MUTED = '#93a09d';

// route name → icon + label. Order matches the Tabs.Screen order.
const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Today', icon: 'syringe' },
  { name: 'doses', label: 'Doses', icon: 'chart-line' },
  { name: 'weight', label: 'Weight', icon: 'weight-scale' },
  { name: 'side-effects', label: 'Effects', icon: 'triangle-exclamation' },
  { name: 'settings', label: 'Settings', icon: 'gear' },
];

export const GlassTabBar = ({ state, navigation }: GlassTabBarProps) => {
  const insets = useSafeAreaInsets();
  const focusedName = state.routes[state.index]?.name;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: insets.bottom + 10 }]}
    >
      <BlurView
        intensity={40}
        tint="light"
        style={[styles.bar, elevation.float]}
      >
        {TABS.map((tab) => {
          const route = state.routes.find((r) => r.name === tab.name);
          const focused = focusedName === tab.name;
          const color = focused ? TEAL : MUTED;

          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                if (focused || !route) return;
                Haptics.selectionAsync();
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!event.defaultPrevented) navigation.navigate(tab.name);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              style={styles.item}
            >
              <Icon icon={tab.icon} size={20} color={color} />
              <Text
                style={[styles.label, { color }]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 8,
    overflow: 'hidden',
    // Translucent warm-white over the blur so the teal/ink read cleanly.
    backgroundColor: 'rgba(255, 253, 249, 0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20, 32, 31, 0.06)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
});

export default GlassTabBar;
