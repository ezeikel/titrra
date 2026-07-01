import { createClient } from '@sanity/client';

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const apiVersion = process.env.SANITY_API_VERSION || '2026-01-01';

if (!projectId) {
  console.warn('[blog] SANITY_PROJECT_ID not set — Sanity writes will fail');
}

export const readClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
});

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

// Idempotency anchor: the top-level sourceTopic field on each generated post.
export const coveredTopicsQuery = `*[_type == "post" && defined(sourceTopic)].sourceTopic`;
export const topicExistsQuery = `count(*[_type == "post" && sourceTopic == $topic]) > 0`;

// Published posts for internal linking (newest 20).
export const recentForLinkingQuery = `*[_type == "post" && status == "published" && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...20]{ title, "slug": slug.current }`;
