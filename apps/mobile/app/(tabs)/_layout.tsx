import { Tabs } from 'expo-router';
import { Icon } from '@/components/Icon';

const TEAL = '#0d9488';
const MUTED = '#5a6b69';

// v1 tab set (see docs/GLP1-RESEARCH-AND-SPEC.md §3):
//   Today (log dose) · Doses/History · Weight · Side Effects · Settings
const TabsLayout = () => (
  <Tabs
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: TEAL,
      tabBarInactiveTintColor: MUTED,
      tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e2e8e6' },
    }}
  >
    <Tabs.Screen
      name="index"
      options={{
        title: 'Today',
        tabBarIcon: ({ color }) => <Icon icon="syringe" color={color} />,
      }}
    />
    <Tabs.Screen
      name="doses"
      options={{
        title: 'Doses',
        tabBarIcon: ({ color }) => <Icon icon="chart-line" color={color} />,
      }}
    />
    <Tabs.Screen
      name="weight"
      options={{
        title: 'Weight',
        tabBarIcon: ({ color }) => <Icon icon="weight-scale" color={color} />,
      }}
    />
    <Tabs.Screen
      name="side-effects"
      options={{
        title: 'Side effects',
        tabBarIcon: ({ color }) => (
          <Icon icon="triangle-exclamation" color={color} />
        ),
      }}
    />
    <Tabs.Screen
      name="settings"
      options={{
        title: 'Settings',
        tabBarIcon: ({ color }) => <Icon icon="gear" color={color} />,
      }}
    />
  </Tabs>
);

export default TabsLayout;
