import Faq from '@/components/Faq';
import FinalCta from '@/components/FinalCta';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import JsonLd from '@/components/JsonLd';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import ValueProps from '@/components/ValueProps';
import { FAQS } from '@/lib/faq-data';
import { buildMetadata } from '@/lib/seo/metadata';
import { faqSchema } from '@/lib/seo/schema';

export const metadata = buildMetadata({ path: '/' });

const HomePage = () => (
  <div id="top" className="flex min-h-dvh flex-col">
    <JsonLd data={faqSchema(FAQS)} />
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
