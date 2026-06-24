import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms governing your use of Titrra, the GLP-1 / weight-loss-shot tracker by Chewy Bytes.',
  alternates: { canonical: '/terms' },
};

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 font-heading text-[22px] font-semibold text-ink">
    {children}
  </h2>
);

const TermsPage = () => (
  <LegalPage title="Terms of Service" updated="24 June 2026">
    <p>
      These terms govern your use of Titrra, a tracker for people using GLP-1
      medications, operated by Chewy Bytes. By using Titrra you agree to these
      terms.
    </p>

    <H2>Not medical advice</H2>
    <p>
      Titrra is for tracking and education only. It is not a medical device and
      does not provide medical advice, diagnosis, or treatment. Titrra never
      recommends a dose change. Always consult a qualified healthcare provider
      about your medication and any changes to your treatment. Never disregard
      or delay professional medical advice because of something in the app. In
      an emergency, contact your local emergency services.
    </p>

    <H2>Your responsibilities</H2>
    <ul className="ml-5 list-disc space-y-2">
      <li>
        You are responsible for the accuracy of the information you log and for
        any decisions you make.
      </li>
      <li>
        You must be old enough to use the app in your country and to consent to
        these terms.
      </li>
      <li>
        You agree not to misuse the app, attempt to disrupt it, or use it
        unlawfully.
      </li>
    </ul>

    <H2>Subscriptions</H2>
    <p>
      Titrra offers an optional paid subscription (Titrra Pro). Purchases made
      through the App Store or Google Play are billed by Apple or Google and are
      subject to their terms; web purchases are processed by Stripe.
      Subscriptions renew automatically unless cancelled before the renewal
      date. You can manage or cancel a subscription in your App Store, Google
      Play, or account settings. Except where required by law, payments are
      non-refundable.
    </p>

    <H2>Intellectual property</H2>
    <p>
      Titrra, including its software, design, and content, is owned by Chewy
      Bytes and protected by law. We grant you a limited, personal,
      non-transferable licence to use the app for its intended purpose.
    </p>

    <H2>Disclaimers &amp; limitation of liability</H2>
    <p>
      Titrra is provided "as is" without warranties of any kind. To the maximum
      extent permitted by law, Chewy Bytes is not liable for any indirect,
      incidental, or consequential damages arising from your use of the app, or
      for any decisions made based on information you tracked in it. Nothing in
      these terms limits liability that cannot be limited by law.
    </p>

    <H2>Changes &amp; termination</H2>
    <p>
      We may update these terms or the app from time to time, and may suspend or
      discontinue features. We will update the date above when terms change.
    </p>

    <H2>Contact</H2>
    <p>
      Questions about these terms? Email{' '}
      <a
        href="mailto:hello@titrra.com"
        className="font-medium text-teal underline"
      >
        hello@titrra.com
      </a>
      .
    </p>
  </LegalPage>
);

export default TermsPage;
