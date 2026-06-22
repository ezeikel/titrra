import { Tabs } from 'expo-router';
import { GlassTabBar, type GlassTabBarProps } from '@/components/GlassTabBar';

// v1 tab set (see docs/GLP1-RESEARCH-AND-SPEC.md §3):
//   Today (log dose) · Doses/History · Weight · Side Effects · Settings
// Rendered through the floating glass tab bar (docs/DESIGN-SYSTEM.md §3).
const TabsLayout = () => (
  <Tabs
    screenOptions={{ headerShown: false }}
    tabBar={(props) => (
      <GlassTabBar {...(props as unknown as GlassTabBarProps)} />
    )}
  >
    <Tabs.Screen name="index" options={{ title: 'Today' }} />
    <Tabs.Screen name="doses" options={{ title: 'Doses' }} />
    <Tabs.Screen name="weight" options={{ title: 'Weight' }} />
    <Tabs.Screen name="side-effects" options={{ title: 'Side effects' }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
  </Tabs>
);

export default TabsLayout;
