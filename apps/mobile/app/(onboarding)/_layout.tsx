import { Stack } from 'expo-router';

// Onboarding stack — no tab bar, no header (each screen draws its own progress
// header via OnboardingStep). Swipe-back stays on so users can revise answers.
const OnboardingLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#faf8f3' },
      animation: 'slide_from_right',
    }}
  />
);

export default OnboardingLayout;
