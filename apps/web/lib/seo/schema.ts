import { SITE_URL, siteUrl } from '@/lib/site';

// JSON-LD schema factory. Per-object @context (portable — each can be dropped
// into its own <JsonLd>), cross-linked via @id so WebSite → Organization
// resolves without a @graph wrapper. Rendered by <components/JsonLd>.

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
// Titrra ships an app icon at public/icon.png (no dedicated wordmark logo yet).
const LOGO_URL = siteUrl('/icon.png');

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Chewy Bytes',
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
} as const;

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: 'Titrra',
  url: SITE_URL,
  description:
    'The focused GLP-1 tracker: dose logging, injection-site rotation, titration ladder, side effects and weight.',
  publisher: { '@id': ORG_ID },
} as const;

// HealthApplication, free-to-start. Deliberately NO aggregateRating — a
// brand-new app has no genuine ratings, and fabricating them violates store
// policy (see the no-fake-social-proof rule).
export const softwareApplicationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Titrra',
  operatingSystem: 'iOS, Android, Web',
  applicationCategory: 'HealthApplication',
  description:
    'Track GLP-1 doses, rotate injection sites, follow your titration ladder, and log side effects and weight.',
  url: SITE_URL,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@id': ORG_ID },
});

export const faqSchema = (faqs: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
});

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
});

export const articleSchema = ({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName,
  image,
  keywords,
}: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  authorName?: string;
  image?: string;
  keywords?: string[];
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  url,
  datePublished,
  dateModified,
  ...(image && { image }),
  ...(keywords && keywords.length > 0 && { keywords: keywords.join(', ') }),
  author: { '@type': 'Person', name: authorName ?? 'Titrra' },
  publisher: {
    '@type': 'Organization',
    name: 'Chewy Bytes',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: LOGO_URL },
  },
});
