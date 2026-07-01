import type { Metadata } from 'next';

// The Studio renders its own full-screen chrome inside the root <body>. This
// layout only overrides metadata (never index the CMS) — it must NOT render its
// own <html>/<body>, since the root layout (app/layout.tsx) already does.
export const metadata: Metadata = {
  title: 'Titrra Studio',
  robots: { index: false },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
