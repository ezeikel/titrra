import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Geist_Mono, Inter } from 'next/font/google';
import JsonLd from '@/components/JsonLd';
import { Toaster } from '@/components/ui/sonner';
import {
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from '@/lib/seo/schema';
import { SITE_URL } from '@/lib/site';
import './globals.css';

// We import the Font Awesome core CSS ourselves (above) so Next bundles it; tell
// FA not to inject it at runtime (which would flash huge unstyled icons).
config.autoAddCss = false;

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});
// Display / headings — mirrors the mobile app (premium-health editorial feel).
const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Titrra: GLP-1 & Shot Tracker — dose, side effects & weight',
    template: '%s | Titrra',
  },
  description:
    'The focused GLP-1 tracker. Log every dose, rotate injection sites, follow your titration ladder, and track side effects + weight. Built for the Ozempic, Wegovy, Mounjaro and Zepbound routine — not calories.',
  keywords: [
    'glp-1 tracker',
    'ozempic tracker',
    'wegovy tracker',
    'mounjaro tracker',
    'zepbound tracker',
    'semaglutide tracker',
    'tirzepatide tracker',
    'weight loss injection',
    'shot reminder',
    'titration',
  ],
  openGraph: {
    title: 'Titrra: stay on track with every dose',
    description:
      'Log your shot, rotate injection sites, follow your titration ladder, and track side effects + weight. The focused GLP-1 tracker.',
    siteName: 'Titrra',
    type: 'website',
    images: [{ url: '/og-card.png', width: 1200, height: 630, alt: 'Titrra' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Titrra: stay on track with every dose',
    description:
      'The focused GLP-1 tracker — dose, injection sites, titration, side effects & weight.',
    images: ['/og-card.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0e7c7b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bricolage.variable} ${geistMono.variable} bg-background`}
    >
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <JsonLd data={softwareApplicationSchema()} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" theme="light" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
