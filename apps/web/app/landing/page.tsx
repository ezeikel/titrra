import type { Metadata } from 'next';
import Faq from '@/components/Faq';
import FinalCta from '@/components/FinalCta';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import ValueProps from '@/components/ValueProps';

export const metadata: Metadata = {
  alternates: {
    canonical: '/landing',
  },
};

const HomePage = () => (
  <div id="top" className="flex min-h-dvh flex-col">
    <SiteNav />
    <main className="flex-1">
      <Hero />
      <ValueProps />
      <HowItWorks />
      <Faq />
      <FinalCta />
    </main>
    <SiteFooter />
  </div>
);

export default HomePage;
