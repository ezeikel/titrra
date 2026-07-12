import { anthropic } from '@ai-sdk/anthropic';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import type { BlogTopic } from './topics.js';

const model = anthropic('claude-sonnet-5');

// The "never runs dry" guarantee. The fixed BLOG_TOPICS seed list is finite, so
// once daily generation exhausts it (or nearly), this asks Claude to PROPOSE a
// fresh batch of GLP-1 topics that are NOT already covered. Deduped against both
// the already-covered set (existing posts) and the fixed seed slugs, so it never
// resurfaces a topic. This is what lets Titrra post daily forever.
//
// Kept in-memory (no Sanity backlog doc needed): we generate candidates on
// demand, filter, and return the first novel one. Cheap, schema-free, and the
// idempotency anchor stays the same `sourceTopic` string.

const dynamicTopicSchema = z.object({
  topics: z
    .array(
      z.object({
        topic: z
          .string()
          .describe(
            'kebab-case slug, 3-6 words, unique, no trailing punctuation',
          ),
        category: z
          .string()
          .describe('one of the existing categories or a sensible new one'),
        keywords: z
          .array(z.string())
          .min(2)
          .max(6)
          .describe('2-6 target search keywords'),
      }),
    )
    .min(1),
});

const DYNAMIC_SYSTEM = `You are the content strategist for Titrra, a GLP-1 medication TRACKER app (semaglutide/tirzepatide: Ozempic, Wegovy, Mounjaro, Zepbound). Propose fresh, genuinely useful, SEO-relevant blog topics for people ON or CONSIDERING these medications.

Rules:
- Topics must be EDUCATIONAL and utility-first (tracking, routine, titration clarity, side-effect awareness, injection-site rotation, lifestyle around the medication). Never dose advice.
- Each topic must be DISTINCT from the ones already covered (given below). No near-duplicates, no rephrasings of covered topics.
- Prefer specific, long-tail, question-shaped angles people actually search ("can you drink alcohol on mounjaro", "glp-1 and cold symptoms", "travelling with an ozempic pen") over broad generic titles.
- Stay on-domain: GLP-1 / weight-management-medication tracking and life around it. No unrelated health topics.
- kebab-case slug for each. Keywords should be real search phrases.`;

// Ask Claude for a batch of novel topics, filter out anything already covered
// or in the fixed seed list, and return them. `covered` is the set of existing
// sourceTopic slugs; `seedSlugs` is the fixed BLOG_TOPICS slugs.
export async function generateDynamicTopics(
  covered: Set<string>,
  seedSlugs: Set<string>,
  count = 8,
): Promise<BlogTopic[]> {
  const excluded = [...new Set([...covered, ...seedSlugs])];
  const excludedList =
    excluded.length > 0
      ? excluded.map((t) => `- ${t}`).join('\n')
      : '(none yet)';

  const { output } = await generateText({
    model,
    system: DYNAMIC_SYSTEM,
    prompt: `Already-covered topics (DO NOT repeat or rephrase these):\n${excludedList}\n\nPropose ${count} NEW distinct Titrra blog topics.`,
    output: Output.object({ schema: dynamicTopicSchema }),
  });

  if (!output) return [];

  // Belt-and-braces: filter again client-side in case the model repeated one.
  const seen = new Set(excluded);
  const fresh: BlogTopic[] = [];
  for (const t of output.topics) {
    const slug = t.topic.trim().toLowerCase();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    fresh.push({ topic: slug, category: t.category, keywords: t.keywords });
  }
  return fresh;
}
