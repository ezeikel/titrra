import { groq } from 'next-sanity';

const postCard = `{
  _id, title, "slug": slug.current, excerpt, publishedAt, estimatedReadTime,
  mainImage{ asset->, alt, caption },
  author->{ name, "slug": slug.current, image, title },
  categories[]->{ title, "slug": slug.current, color }
}`;

// PUBLISHED only — a post is visible only after a human both publishes the
// Sanity draft AND flips status to 'published' (the health-content gate).
export const allPostsQuery = groq`
  *[_type == "post" && status == "published" && !(_id in path("drafts.**"))]
    | order(publishedAt desc) ${postCard}`;

export const postBySlugQuery = groq`
  *[_type == "post" && status == "published" && slug.current == $slug
    && !(_id in path("drafts.**"))][0]{
    ..., "slug": slug.current, mainImage{ asset->, alt, caption },
    author->{ name, "slug": slug.current, image, title, bio },
    categories[]->{ title, "slug": slug.current, color },
    body, seoKeywords, estimatedReadTime
  }`;

export const postSlugsQuery = groq`
  *[_type == "post" && status == "published" && !(_id in path("drafts.**"))].slug.current`;

// Sitemap projection — matches the lib/seo/blog.ts contract.
export const sitemapPostsQuery = groq`
  *[_type == "post" && status == "published" && !(_id in path("drafts.**"))]
    | order(publishedAt desc){ "slug": slug.current, publishedAt, "updatedAt": _updatedAt }`;

// Internal-linking feed for the worker prompt (published, newest 20).
export const recentForLinkingQuery = groq`
  *[_type == "post" && status == "published" && !(_id in path("drafts.**"))]
    | order(publishedAt desc)[0...20]{ title, "slug": slug.current }`;
