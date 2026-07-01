import 'server-only';
import { client, isSanityConfigured } from '@/lib/sanity/client';
import { postBySlugQuery, sitemapPostsQuery } from '@/lib/sanity/queries';

export type SitemapBlogPost = {
  slug: string;
  publishedAt: string;
  updatedAt: string;
};

// Sitemap feed — never break the sitemap build if Sanity is unconfigured or
// unreachable.
export async function getSitemapBlogPosts(): Promise<SitemapBlogPost[]> {
  if (!isSanityConfigured) return [];
  try {
    return await client.fetch<SitemapBlogPost[]>(sitemapPostsQuery);
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  if (!isSanityConfigured) return null;
  try {
    return await client.fetch(postBySlugQuery, { slug });
  } catch {
    return null;
  }
}
