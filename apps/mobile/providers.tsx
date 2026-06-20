import { PostHogProvider } from 'posthog-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingProvider } from '@/contexts/onboarding';
import { PurchasesProvider } from '@/contexts/purchases';
import { posthog } from '@/lib/analytics';

type ProvidersProps = {
  children: React.ReactNode;
};

// Automatic screen tracking (the mobile analogue of web's automatic
// pageviews) — custom events go through lib/analytics trackEvent.
const WithPostHog = ({ children }: ProvidersProps) =>
  posthog ? (
    <PostHogProvider
      client={posthog}
      autocapture={{ captureScreens: true, captureTouches: false }}
    >
      {children}
    </PostHogProvider>
  ) : (
    children
  );

// Provider order: gesture root outermost so everything below can use gestures
// + safe area; purchases innermost so screens can read Pro status.
const Providers = ({ children }: ProvidersProps) => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <WithPostHog>
        <PurchasesProvider>
          <OnboardingProvider>{children}</OnboardingProvider>
        </PurchasesProvider>
      </WithPostHog>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

export default Providers;
