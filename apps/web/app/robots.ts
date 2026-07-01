import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/app/', // authenticated tracker shell — never index
          '/onboarding/', // funnel, not a landing surface
          '/studio/', // embedded Sanity CMS
          '/api/',
          '/_next/',
        ],
      },
      // Block the major AI training/scraper bots.
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'ChatGPT-User', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: new URL(SITE_URL).host, // bare host "titrra.com" — no scheme
  };
}
