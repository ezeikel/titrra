import { faEnvelope } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';

export const metadata: Metadata = {
  title: 'Check your email · Titrra',
  robots: { index: false, follow: false },
};

// Shown after a magic link is requested (NextAuth pages.verifyRequest). Mirrors
// the mobile "check your email" state.
const VerifyRequestPage = () => (
  <div className="flex min-h-svh flex-col bg-sand">
    <SiteNav />
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-teal/15 text-teal">
        <FontAwesomeIcon icon={faEnvelope} className="text-xl" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        Check your email
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We sent you a sign-in link. Tap it to finish signing in. The link
        expires in 15 minutes, so use it soon.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Not seeing it? Check your spam folder.
      </p>
      <Link
        href="/signin"
        className="mx-auto mt-8 inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold text-ink transition hover:bg-muted"
      >
        Use a different email
      </Link>
    </main>
    <SiteFooter />
  </div>
);

export default VerifyRequestPage;
