import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Titrra collects, uses, and protects your data. Titrra is a GLP-1 / weight-loss-shot tracker by Chewy Bytes.',
  alternates: { canonical: '/privacy' },
};

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 font-heading text-[22px] font-semibold text-ink">
    {children}
  </h2>
);

const PrivacyPage = () => (
  <LegalPage title="Privacy Policy" updated="24 June 2026">
    <p>
      Titrra ("we", "us") is a tracker for people using GLP-1 medications. This
      policy explains what we collect, why, and the choices you have. Titrra is
      operated by Chewy Bytes. It is for tracking and education only and is not
      medical advice.
    </p>

    <H2>The short version</H2>
    <ul className="ml-5 list-disc space-y-2">
      <li>
        You can use Titrra anonymously — we don&apos;t require an account, a
        name, or an email to track.
      </li>
      <li>
        The health-related information you log (doses, injection sites,
        titration plan, side effects, weight) is stored to power the app&apos;s
        features. We do not sell it.
      </li>
      <li>
        We use privacy-respecting analytics and crash reporting to improve the
        app. These are configured to minimise personal data.
      </li>
      <li>You can request deletion of your data at any time.</li>
    </ul>

    <H2>Information we collect</H2>
    <p>
      <strong>Information you provide.</strong> When you use Titrra you may log
      medication and dose details, injection sites, your titration plan, side
      effects, and weight entries. If you create an account or contact us, we
      collect the email address you provide.
    </p>
    <p>
      <strong>Anonymous device identifier.</strong> To save your data without
      requiring an account, we generate a random identifier stored on your
      device and associate your logs with it. It is not linked to your real
      identity unless you later add an email.
    </p>
    <p>
      <strong>Usage and diagnostics.</strong> We use PostHog for product
      analytics and Sentry for crash reporting so we can understand how the app
      is used and fix problems. These collect events, app version, device type,
      and error details. We configure them to mask text and avoid collecting
      unnecessary personal data.
    </p>
    <p>
      <strong>Purchases.</strong> Subscriptions are processed by Apple, Google,
      RevenueCat, and Stripe. We receive subscription status (active / expired)
      but never your full card details.
    </p>

    <H2>How we use information</H2>
    <ul className="ml-5 list-disc space-y-2">
      <li>To provide the tracker&apos;s features and save your entries.</li>
      <li>To suggest injection sites and surface your titration progress.</li>
      <li>To operate, secure, debug, and improve the app.</li>
      <li>To process subscriptions and provide support.</li>
    </ul>
    <p>
      We do not sell your personal information, and we do not use your health
      logs for advertising.
    </p>

    <H2>Health data</H2>
    <p>
      Some of what you log relates to your health. We treat it with care: it is
      used to provide the app&apos;s features, is not sold, and is not shared
      for advertising. Titrra never recommends a dose change and is not a
      substitute for professional medical advice — always talk to your
      healthcare provider.
    </p>

    <H2>Sharing</H2>
    <p>
      We share information only with the service providers that help us run
      Titrra (such as our database host, analytics, crash reporting, and payment
      processors), and where required by law. These providers process data on
      our behalf under appropriate terms.
    </p>

    <H2>Retention &amp; deletion</H2>
    <p>
      We keep your data while you use Titrra. You can request export or deletion
      of your data at any time by emailing us at the address below; we will
      delete the data associated with your device or account. You can also clear
      your local data from within the app&apos;s settings.
    </p>

    <H2>Your rights</H2>
    <p>
      Depending on where you live (for example under UK GDPR / EU GDPR or the
      CCPA), you may have rights to access, correct, delete, or restrict use of
      your personal data, and to data portability. To exercise these, contact us
      below.
    </p>

    <H2>Children</H2>
    <p>
      Titrra is not directed to children under 13 (or the equivalent minimum age
      in your country) and we do not knowingly collect their personal data.
    </p>

    <H2>Changes</H2>
    <p>
      We may update this policy from time to time. We will update the date at
      the top when we do.
    </p>

    <H2>Contact</H2>
    <p>
      Questions, or to request export or deletion, email{' '}
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

export default PrivacyPage;
