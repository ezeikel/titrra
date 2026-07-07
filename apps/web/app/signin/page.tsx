import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/auth';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import SignInOptions from './SignInOptions';

export const metadata: Metadata = {
  title: 'Sign in · Titrra',
  description:
    'Sign in to Titrra to sync your tracking across your devices and the web.',
  alternates: { canonical: '/signin' },
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ callbackUrl?: string }>;

// Keep the post-sign-in destination on-site (open-redirect safe).
const safeCallback = (raw?: string) =>
  raw && /^\/(?!\/)/.test(raw) ? raw : '/';

// Dynamic — reads searchParams + session, so it lives behind Suspense
// (cacheComponents requires uncached data to be wrapped).
const SignInBody = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { callbackUrl } = await searchParams;
  const dest = safeCallback(callbackUrl);

  const session = await auth();
  if (session?.user) redirect(dest);

  return <SignInOptions callbackUrl={dest} />;
};

const SignInPage = ({ searchParams }: { searchParams: SearchParams }) => (
  <div className="flex min-h-svh flex-col bg-sand">
    <SiteNav />
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep your tracking in sync across your devices and the web. Titrra
          works fully without an account, too.
        </p>
      </div>
      <Suspense fallback={null}>
        <SignInBody searchParams={searchParams} />
      </Suspense>
    </main>
    <SiteFooter />
  </div>
);

export default SignInPage;
