import type { IconName } from '@/components/Icon';

// Value-prop slides shown before the quiz (the intro carousel). Each slide
// pitches one pillar of Titrra's positioning — focused GLP-1 tracking, not a
// calorie app. Copy lives here so the components stay presentational.

export type IntroSlideData = {
  // Which built-in hero visual the slide renders.
  visual: 'dose' | 'rotation' | 'ladder' | 'pricing';
  icon: IconName;
  title: string;
  subtitle: string;
};

export const INTRO_SLIDES: IntroSlideData[] = [
  {
    visual: 'dose',
    icon: 'syringe',
    title: 'Stay on track with every dose.',
    subtitle:
      'The focused tracker for your weight-loss shot — built around your routine, not calories.',
  },
  {
    visual: 'rotation',
    icon: 'syringe',
    title: 'Never overuse a spot again.',
    subtitle:
      'Titrra remembers every injection site and suggests the next one — so your skin gets a proper break.',
  },
  {
    visual: 'ladder',
    icon: 'chart-line',
    title: 'Follow your titration ladder.',
    subtitle:
      'See exactly where you are on your dose plan, and get a nudge when it’s time to talk to your provider about stepping up.',
  },
  {
    visual: 'pricing',
    icon: 'heart-pulse',
    title: 'One honest price. No maze.',
    subtitle:
      'No confusing tiers or weekly traps — just a calm, premium tracker for your journey.',
  },
];
