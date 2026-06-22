import { Stack } from 'expo-router';

// Onboarding stack — no tab bar, no header (each screen draws its own progress
// dots via OnboardingStep). The paged slide animation gives a carousel feel;
// forward motion is the validated Continue button (so a swipe can never skip a
// required step), while the native back gesture lets users revise answers.
const OnboardingLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#f7f4ed' },
      animation: 'slide_from_right',
      gestureEnabled: true,
    }}
  />
);

export default OnboardingLayout;
