import type { ReactNode } from 'react';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';

// Shared chrome for the marketing legal pages (Privacy, Terms). Mirrors the
// landing page's SiteNav + SiteFooter so the legal pages feel part of the site.
// The prose styling is plain + readable — these are reference documents, not
// conversion surfaces.
export const LegalPage = ({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) => (
  <div className="flex min-h-dvh flex-col">
    <SiteNav />
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <h1 className="font-heading text-[36px] font-bold leading-tight text-ink">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {updated}
      </p>
      <div className="legal-prose mt-10 space-y-6 text-[15px] leading-relaxed text-ink">
        {children}
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default LegalPage;
