import { useRouter } from 'expo-router';
import { IntroCarousel } from '@/components/onboarding/IntroCarousel';
import { trackEvent } from '@/lib/analytics';

// Onboarding entry — the swipeable value-prop carousel. Finishing it (or
// Skip) starts the quiz. Replaces the old single welcome screen.
const Intro = () => {
  const router = useRouter();

  const start = () => {
    trackEvent('onboarding_started');
    router.push('/(onboarding)/name');
  };

  return <IntroCarousel onComplete={start} />;
};

export default Intro;
