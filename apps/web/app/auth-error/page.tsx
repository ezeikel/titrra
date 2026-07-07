import { faTriangleExclamation } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';

export const metadata: Metadata = {
  title: 'Sign-in problem · Titrra',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string }>;

// NextAuth error codes we surface with tailored copy; everything else is generic.
// `Verification` = an expired or already-used magic link.
const MESSAGES: Record<string, string> = {
  Verification:
    'That sign-in link is invalid or has expired. Request a fresh one and try again.',
  Configuration:
    'Sign-in is temporarily unavailable. Please try again in a little while.',
  AccessDenied: 'You do not have access with that account.',
  OAuthAccountNotLinked:
    'That email is already linked to a different sign-in method. Use the one you signed up with.',
};

// Dynamic — reads the ?error= param, so it sits behind Suspense (cacheComponents).
const ErrorMessage = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const { error } = await searchParams;
  const message =
    (error && MESSAGES[error]) ??
    'Something went wrong signing you in. Please try again.';
  return <p className="mt-3 text-sm text-muted-foreground">{message}</p>;
};

const AuthErrorPage = ({ searchParams }: { searchParams: SearchParams }) => (
  <div className="flex min-h-svh flex-col bg-sand">
    <SiteNav />
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-xl" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        Sign-in problem
      </h1>
      <Suspense fallback={<p className="mt-3 text-sm text-muted-foreground" />}>
        <ErrorMessage searchParams={searchParams} />
      </Suspense>
      <Link
        href="/signin"
        className="mx-auto mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-teal px-6 text-sm font-semibold text-white transition hover:bg-teal-deep"
      >
        Back to sign in
      </Link>
    </main>
    <SiteFooter />
  </div>
);

export default AuthErrorPage;
