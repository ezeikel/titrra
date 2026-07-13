import { anthropic } from '@ai-sdk/anthropic';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { generateDynamicTopics } from './dynamic-topics.js';
import { generateBlogMainImage } from './image.js';
import { markdownToPortableText } from './markdown-to-portable-text.js';
import {
  coveredTopicsQuery,
  readClient,
  recentForLinkingQuery,
  topicExistsQuery,
  writeClient,
} from './sanity.js';
import {
  pickRandomAuthor,
  pickUncoveredTopic,
  seedTopicSlugs,
} from './topics.js';

const model = anthropic('claude-sonnet-5');

// After publishing, tell the web app to bust its blog cache so the post appears
// immediately (the blog pages use cacheTag('blog-list'/'blog-posts')). No-op if
// WEB_URL or CRON_SECRET is unset. Non-fatal: never fails the publish.
async function revalidateWebBlog(): Promise<void> {
  const webUrl = process.env.WEB_URL?.replace(/\/+$/, '');
  const secret = process.env.CRON_SECRET;
  if (!webUrl || !secret) return;
  try {
    const res = await fetch(`${webUrl}/api/revalidate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(10_000),
    });
    console.log(`[blog] revalidate web blog: ${res.status}`);
  } catch (err) {
    console.error('[blog] revalidate failed (non-fatal):', err);
  }
}

// Em dashes read as AI-generated; swap for commas / hyphens (house style).
const stripEmDashes = (s: string): string =>
  s.replace(/\s*—\s*/g, ', ').replace(/—/g, '-');
const NO_EM_DASHES_RULE = 'Never use em dashes (—). Use commas or restructure.';

const blogMetaSchema = z.object({
  title: z.string().describe('SEO title, 50-60 chars'),
  slug: z.string().describe('URL slug, lowercase hyphenated, 3-6 words'),
  excerpt: z.string().describe('Meta description, 150-160 chars'),
  estimatedReadTime: z.number().describe('Read time in minutes'),
  seoKeywords: z.array(z.string()).describe('4-8 target keywords'),
});

const META_SYSTEM = `You are an SEO editor for Titrra, a GLP-1 medication tracker. Write educational, evidence-informed metadata for a blog post. ${NO_EM_DASHES_RULE}`;

const BODY_SYSTEM = `You write educational GLP-1 blog posts for Titrra. Audience: people on or considering semaglutide/tirzepatide (Ozempic, Wegovy, Mounjaro, Zepbound). Tone: warm, clear, factual.
Rules:
- This is EDUCATION, never medical advice. Never give specific dose instructions; always say to consult a clinician.
- Use markdown: ## and ### headings, short paragraphs, bullet lists.
- 900-1400 words. Reflect general medical consensus; do NOT fabricate studies or statistics.
- ${NO_EM_DASHES_RULE}`;

type RunOpts = { topicOverride?: string; dryRun?: boolean };

// Generate one GLP-1 blog post and PUBLISH it to Sanity. Runs daily; topic
// supply is guaranteed by the fixed seed list plus a dynamic AI topic generator
// (never runs dry). Compliance lives in the prompt, not a review gate.
export async function runBlogCron(opts: RunOpts = {}): Promise<void> {
  try {
    const covered = new Set(
      await readClient.fetch<string[]>(coveredTopicsQuery).catch(() => []),
    );
    let topic = pickUncoveredTopic(covered, opts.topicOverride);

    // NEVER-DRY fallback: the fixed seed list is finite, so once daily
    // generation exhausts it, ask Claude for fresh, deduped topics. This is what
    // lets Titrra post daily indefinitely. Skipped when a topicOverride is set.
    if (!topic && !opts.topicOverride) {
      console.log('[blog] seed list exhausted, generating dynamic topics');
      const dynamic = await generateDynamicTopics(covered, seedTopicSlugs());
      topic = dynamic[0] ?? null;
      if (topic) console.log(`[blog] dynamic topic: ${topic.topic}`);
    }

    if (!topic) {
      console.warn('[blog] no uncovered topic available (dynamic gen empty)');
      return;
    }

    // Re-check idempotency (guards a race between parallel cron hits).
    if (!opts.topicOverride && !opts.dryRun) {
      const exists = await readClient.fetch<boolean>(topicExistsQuery, {
        topic: topic.topic,
      });
      if (exists) {
        console.log(`[blog] topic already covered, skipping: ${topic.topic}`);
        return;
      }
    }

    const recent = await readClient
      .fetch<{ title: string; slug: string }[]>(recentForLinkingQuery)
      .catch(() => []);

    // META (structured output).
    const { output: meta } = await generateText({
      model,
      system: META_SYSTEM,
      prompt: `Topic: ${topic.topic}\nKeywords: ${topic.keywords.join(', ')}\nWrite the metadata.`,
      output: Output.object({ schema: blogMetaSchema }),
    });
    if (!meta) throw new Error('meta generation returned empty');

    // BODY (plain markdown).
    const linkList = recent
      .map((r) => `- ${r.title}: /blog/${r.slug}`)
      .join('\n');
    const { text: rawBody } = await generateText({
      model,
      system: BODY_SYSTEM,
      prompt: `Write the full markdown body for "${meta.title}".\nTopic: ${topic.topic}.\nTarget keywords: ${topic.keywords.join(', ')}.\nWhere natural, internally link to these existing posts:\n${linkList || '(none yet)'}`,
    });

    const content = stripEmDashes(rawBody);
    const body = markdownToPortableText(content);
    const author = pickRandomAuthor();

    if (opts.dryRun) {
      console.log(`[blog] dryRun — would write draft: "${meta.title}"`);
      console.log(`[blog] slug: ${meta.slug}, blocks: ${body.length}`);
      return;
    }

    // Upsert the author.
    let authorRef = await writeClient.fetch<string | null>(
      `*[_type == "author" && slug.current == $slug][0]._id`,
      { slug: author.slug },
    );
    if (!authorRef) {
      const created = await writeClient.create({
        _type: 'author',
        name: author.name,
        slug: { _type: 'slug', current: author.slug },
        title: author.title,
        bio: author.bio,
      });
      authorRef = created._id;
    }

    // Featured image: Pexels high-match (Opus 4.8 judge) → gpt-image-2 high
    // fallback → Sanity asset. Non-blocking: returns undefined on failure and
    // the post publishes without an image rather than not at all.
    const mainImage = await generateBlogMainImage(meta.title, meta.excerpt);

    // Write the post. Auto-published (status:'published') — compliance is
    // enforced entirely in the generation prompt (education-not-advice, no dose
    // instructions, no fabricated stats, no em dashes), since there is no
    // human-review gate. See BODY_SYSTEM / META_SYSTEM above.
    await writeClient.create({
      _type: 'post',
      title: stripEmDashes(meta.title),
      slug: { _type: 'slug', current: meta.slug },
      excerpt: stripEmDashes(meta.excerpt),
      estimatedReadTime: meta.estimatedReadTime,
      seoKeywords: meta.seoKeywords,
      body,
      ...(mainImage ? { mainImage } : {}),
      author: { _type: 'reference', _ref: authorRef },
      publishedAt: new Date().toISOString(),
      status: 'published',
      sourceTopic: topic.topic,
      generatedAt: new Date().toISOString(),
      model: 'claude-sonnet-5',
    });
    console.log(
      `[blog] published: ${meta.slug}${mainImage ? ' (with image)' : ''}`,
    );
    await revalidateWebBlog();
  } catch (err) {
    console.error('[blog] pipeline failed:', err);
    throw err;
  }
}
