import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';

// Shared per-route metadata builder. The root layout owns the DEFAULTS
// (metadataBase, title.template, base OG/twitter); this helper only OVERRIDES
// per page. Canonical is set relative so metadataBase absolutises it; og:url is
// built absolute via siteUrl().

type BuildMetadataArgs = {
  // WITHOUT the "| Titrra" suffix — the root template adds it.
  title?: string;
  description?: string;
  // e.g. '/blog/my-post' — drives canonical + og:url.
  path?: string;
  // Explicit OG image. When omitted, the static marketing card is used —
  // unless noDefaultOgImage is set (for routes with their own
  // opengraph-image.tsx, e.g. /blog/[slug] and /glp-1/[drug]).
  ogImage?: string;
  noDefaultOgImage?: boolean;
  ogType?: 'website' | 'article';
  keywords?: string[];
  noindex?: boolean;
  // ISO date, for ogType='article'.
  publishedTime?: string;
  authors?: string[];
  tags?: string[];
};

const DEFAULT_DESCRIPTION =
  'The focused GLP-1 tracker. Log every dose, rotate injection sites, follow your titration ladder, and track side effects + weight.';

// Branded static social card for marketing/programmatic pages.
const DEFAULT_OG_IMAGE = '/og-card.png';

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  ogImage,
  noDefaultOgImage,
  ogType = 'website',
  keywords,
  noindex,
  publishedTime,
  authors,
  tags,
}: BuildMetadataArgs = {}): Metadata {
  const resolvedImage =
    ogImage ?? (noDefaultOgImage ? undefined : DEFAULT_OG_IMAGE);
  const images = resolvedImage ? [{ url: resolvedImage }] : undefined;
  const ogTitle = title ? `${title} | Titrra` : undefined;

  return {
    ...(title ? { title } : {}),
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: ogType,
      title: ogTitle,
      description,
      url: siteUrl(path),
      siteName: 'Titrra',
      ...(images ? { images } : {}),
      ...(ogType === 'article' && publishedTime ? { publishedTime } : {}),
      ...(authors ? { authors } : {}),
      ...(tags ? { tags } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}
