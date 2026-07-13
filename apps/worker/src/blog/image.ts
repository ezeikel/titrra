import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import {
  experimental_generateImage as generateImage,
  generateText,
  Output,
} from 'ai';
import { z } from 'zod';
import { writeClient } from './sanity.js';

// Blog featured image, standardised across the fleet:
//   Pexels search  →  Opus 4.8 vision judge  →  use it only if a HIGH match,
//   else generate with gpt-image-2 (high)  →  upload the bytes into Sanity as an
//   asset and return the `mainImage` reference.
//
// Final storage is a Sanity ASSET (matches PTP + Chunky Crayon — neither stores
// an R2 URL nor hotlinks Pexels; the bytes are downloaded and re-uploaded to
// Sanity). If anything fails the caller ships the post with no image rather than
// blocking publication.

const captionModel = anthropic('claude-sonnet-5');
const judgeModel = anthropic('claude-opus-4-8'); // Opus 4.8 vision judge

// The Pexels relevance bar. Only use a stock photo the judge is clearly happy
// with; any doubt falls through to gpt-image-2.
const PEXELS_CONFIDENCE_THRESHOLD = 70;

type SanityImageRef = {
  _type: 'image';
  asset: { _type: 'reference'; _ref: string };
  alt?: string;
  credit?: string;
  creditUrl?: string;
};

type PexelsPhoto = {
  id: number;
  photographer: string;
  photographer_url: string;
  alt: string;
  src: { large2x: string; large: string; original: string };
};

const searchTermsSchema = z.object({
  searchTerms: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe('2-4 concrete, visual stock-photo search phrases'),
  altText: z.string().describe('descriptive alt text for the chosen image'),
});

const judgeSchema = z.object({
  isRelevant: z.boolean(),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
});

// Ask Claude for good stock-photo search phrases for this post. GLP-1 posts want
// calm, premium, lifestyle/wellness imagery — NOT clinical, needles, pills, or
// weight-loss "before/after" framing.
async function generateSearchTerms(
  title: string,
  excerpt: string,
): Promise<{ searchTerms: string[]; altText: string } | null> {
  try {
    const { output } = await generateText({
      model: captionModel,
      system:
        'You pick stock-photo search phrases for a calm, premium GLP-1 medication TRACKER blog. Prefer warm lifestyle/wellness imagery: healthy food, hydration, journaling, walking, calm home scenes. NEVER suggest needles, syringes, pills, scales, clinical settings, or weight-loss before/after imagery.',
      prompt: `Blog title: ${title}\nExcerpt: ${excerpt}\nGive search phrases + alt text.`,
      output: Output.object({ schema: searchTermsSchema }),
    });
    return output ?? null;
  } catch (err) {
    console.error('[blog-image] search-term generation failed:', err);
    return null;
  }
}

async function searchPexels(terms: string[]): Promise<PexelsPhoto[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const photos: PexelsPhoto[] = [];
  for (const term of terms) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(term)}&per_page=3&orientation=landscape&size=large`,
        { headers: { Authorization: key } },
      );
      if (!res.ok) continue;
      const data = (await res.json()) as { photos?: PexelsPhoto[] };
      if (data.photos) photos.push(...data.photos);
    } catch {
      // skip this term
    }
  }
  // Dedupe by id.
  const seen = new Set<number>();
  return photos.filter((p) =>
    seen.has(p.id) ? false : (seen.add(p.id), true),
  );
}

// Opus 4.8 vision judge: is this stock photo a clear, on-brand match?
async function judgePhoto(photo: PexelsPhoto, title: string): Promise<number> {
  try {
    const { output } = await generateText({
      model: judgeModel,
      output: Output.object({ schema: judgeSchema }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `This image is a candidate featured photo for a calm, premium GLP-1 medication tracker blog post titled "${title}". Judge whether it is a clear, on-topic, on-brand match: warm, tasteful, lifestyle/wellness. Reject anything clinical, off-topic, generic-corporate, or that shows needles/pills/scales/before-after weight imagery. Return isRelevant, confidence (0-100), reasoning.`,
            },
            { type: 'image', image: photo.src.large },
          ],
        },
      ],
    });
    if (!output) return 0;
    return output.isRelevant ? output.confidence : 0;
  } catch (err) {
    console.error('[blog-image] judge failed:', err);
    return 0;
  }
}

async function uploadBufferToSanity(
  buffer: Buffer,
  filename: string,
): Promise<{ _type: 'reference'; _ref: string }> {
  const asset = await writeClient.assets.upload('image', buffer, { filename });
  return { _type: 'reference', _ref: asset._id };
}

// gpt-image-2 (high) fallback — a calm wellness illustration, no text, no
// clinical/needle/scale imagery.
async function generateImageFallback(title: string): Promise<Buffer | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const { image } = await generateImage({
      model: openai.image('gpt-image-2'),
      prompt: `A calm, premium wellness lifestyle image for a GLP-1 tracker blog post titled "${title}". Warm teal and sand palette, soft natural light. No text, no words. Do NOT show needles, syringes, pills, a weighing scale, or any before/after weight-loss imagery.`,
      size: '1024x1024',
      providerOptions: { openai: { quality: 'high' } },
    });
    return Buffer.from(image.base64, 'base64');
  } catch (err) {
    console.error('[blog-image] gpt-image-2 fallback failed:', err);
    return null;
  }
}

// Produce the post's mainImage: Pexels-high-match → gpt-image-2 fallback →
// Sanity asset. Returns undefined (no image) on total failure — never throws.
export async function generateBlogMainImage(
  title: string,
  excerpt: string,
): Promise<SanityImageRef | undefined> {
  try {
    const terms = await generateSearchTerms(title, excerpt);
    const altText = terms?.altText ?? title;

    // 1) Pexels + Opus 4.8 judge.
    if (terms?.searchTerms?.length) {
      const candidates = await searchPexels(terms.searchTerms);
      if (candidates.length > 0) {
        const scored = await Promise.all(
          candidates.map(async (p) => ({
            p,
            score: await judgePhoto(p, title),
          })),
        );
        scored.sort((a, b) => b.score - a.score);
        const best = scored[0];
        if (best && best.score >= PEXELS_CONFIDENCE_THRESHOLD) {
          const res = await fetch(best.p.src.large2x);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            const asset = await uploadBufferToSanity(
              buf,
              `pexels-${best.p.id}.jpg`,
            );
            console.log(
              `[blog-image] using Pexels photo ${best.p.id} (judge ${best.score})`,
            );
            return {
              _type: 'image',
              asset,
              alt: altText,
              credit: best.p.photographer,
              creditUrl: best.p.photographer_url,
            };
          }
        }
        console.log(
          `[blog-image] no Pexels photo cleared the bar (best ${scored[0]?.score ?? 0}), generating`,
        );
      }
    }

    // 2) gpt-image-2 high fallback.
    const generated = await generateImageFallback(title);
    if (generated) {
      const asset = await uploadBufferToSanity(
        generated,
        `generated-${Date.now()}.png`,
      );
      console.log('[blog-image] using gpt-image-2 generated image');
      return {
        _type: 'image',
        asset,
        alt: altText,
        credit: 'Generated with AI',
      };
    }

    console.warn('[blog-image] no image produced; publishing without one');
    return undefined;
  } catch (err) {
    console.error('[blog-image] failed, publishing without image:', err);
    return undefined;
  }
}
