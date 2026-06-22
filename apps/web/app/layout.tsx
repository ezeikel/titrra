import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Geist_Mono, Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { SITE_URL } from '@/lib/site';
import './globals.css';

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Titrra: stay on track with every dose',
    description:
      'The focused GLP-1 tracker — dose, injection sites, titration, side effects & weight.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0d9488',
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Titrra',
  url: SITE_URL,
  description:
    'The focused GLP-1 tracker: dose logging, injection-site rotation, titration ladder, side effects and weight.',
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
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" theme="light" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
