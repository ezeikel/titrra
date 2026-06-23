import type { ReactNode } from 'react';
import { OnboardingProvider } from '@/contexts/onboarding';

// All onboarding steps share one accumulator (the OnboardingProvider). The
// answers live only in memory until the atomic commit at the building step.
const OnboardingLayout = ({ children }: { children: ReactNode }) => (
  <OnboardingProvider>{children}</OnboardingProvider>
);

export default OnboardingLayout;
