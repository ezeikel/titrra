import type { MetadataRoute } from 'next';
import { getSitemapBlogPosts } from '@/lib/seo/blog';
import { SITE_URL } from '@/lib/site';

// PHASE E (programmatic GLP-1): import { getGlp1PageSlugs } from '@/lib/seo/glp1-pages';

const BASE_URL = SITE_URL;

// Build-time stamp. Kept OUT of a per-request `new Date()` so the sitemap
// prerenders cleanly under cacheComponents. Bump on meaningful marketing edits.
const LAST_MODIFIED = new Date('2026-07-01');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Marketing + legal only. /app, /app/*, /onboarding are intentionally
  // excluded (noindex + disallowed in robots.ts).
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // PHASE E — config-array driven (see lib/seo/glp1-pages.ts). Empty today.
  // const glp1Pages: MetadataRoute.Sitemap = getGlp1PageSlugs().map((slug) => ({
  //   url: `${BASE_URL}/glp-1/${slug}`,
  //   lastModified: LAST_MODIFIED,
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.7,
  // }));
  const glp1Pages: MetadataRoute.Sitemap = [];

  // Sanity blog. Each entry uses its own date; helper try/catches → [].
  const posts = await getSitemapBlogPosts();
  const blogPages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt || p.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...glp1Pages, ...blogPages];
}
