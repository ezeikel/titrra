import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth, getConfiguredProviders } from '@/auth';
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

// Bounce already-signed-in visitors. Isolated in its own Suspense boundary so the
// buttons never depend on this auth() lookup; auth() is wrapped so a failure can't
// break the page, and redirect() (which throws) runs outside the try.
const RedirectIfSignedIn = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const { callbackUrl } = await searchParams;
  let signedIn = false;
  try {
    const session = await auth();
    signedIn = !!session?.user;
  } catch {
    signedIn = false;
  }
  if (signedIn) redirect(safeCallback(callbackUrl));
  return null;
};

// The buttons render from getConfiguredProviders() (a plain process.env read — NOT
// a cacheComponents "uncached" source, so it's fine in the static shell) and
// SignInOptions reads callbackUrl client-side. So the buttons are in the static
// prerendered HTML; only the signed-in redirect streams behind Suspense. (A
// Suspense body that streamed the buttons failed in prod, leaving an empty card.)
const SignInPage = ({ searchParams }: { searchParams: SearchParams }) => {
  const providers = getConfiguredProviders();
  return (
    <div className="flex min-h-svh flex-col bg-sand">
      <SiteNav />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep your tracking in sync across your devices and the web. Titrra
            works fully without an account, too.
          </p>
        </div>
        <SignInOptions providers={providers} />
        <Suspense fallback={null}>
          <RedirectIfSignedIn searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
};

export default SignInPage;
