'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

// Onboarding entry — kicks the quiz off at the name step (the web app skips the
// mobile intro carousel; the landing page at /landing already does that job).
const OnboardingIndex = () => {
  const router = useRouter();
  useEffect(() => {
    trackEvent('onboarding_started');
    router.replace('/onboarding/name');
  }, [router]);
  return null;
};

export default OnboardingIndex;
