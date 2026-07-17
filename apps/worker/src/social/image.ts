import { openai } from '@ai-sdk/openai';
import { put } from '@titrra/storage';
import { experimental_generateImage as generateImage } from 'ai';

// gpt-image-2 — same image model Chunky Crayon + PTP use. nano-banana-pro is
// reserved for photorealistic human personas (AI-UGC), which this is not.
const IMAGE_MODEL_ID = 'gpt-image-2';

// Square 1080x1080 — the Facebook feed sweet spot (also fine for a later IG feed
// post). gpt-image-2 supports 1024x1024; FB up-scales imperceptibly.
const IMAGE_SIZE = '1024x1024' as const;

export type GeneratedSocialImage = {
  // Public R2 URL that Facebook's Graph /photos endpoint fetches directly.
  url: string;
  pathname: string;
};

// Generate one social image from a theme's visual concept, upload it to R2, and
// return the public URL. Lazy model init keeps the worker booting when
// OPENAI_API_KEY is unset (blog-only deploys).
export async function generateSocialImage(
  themeKey: string,
  imageConcept: string,
  dateStamp: string,
): Promise<GeneratedSocialImage> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set — cannot generate social image');
  }

  const prompt = [
    imageConcept,
    'Style: modern wellness-app marketing photography, soft natural light, shallow depth of field, premium and calm.',
    'Palette: warm teal and sand with off-white. Absolutely no text, no words, no logos, no watermarks.',
    'Do NOT show: people, faces, bodies, needles, syringes, pills, a weighing scale, food, or any before/after or weight-loss imagery.',
  ].join(' ');

  const { image } = await generateImage({
    model: openai.image(IMAGE_MODEL_ID),
    prompt,
    size: IMAGE_SIZE,
    providerOptions: { openai: { quality: 'high' } },
  });

  // The AI SDK returns the image as base64; convert to a Buffer for R2.
  const buffer = Buffer.from(image.base64, 'base64');

  // Durable, dated key so posts are auditable in the bucket. Prod serves this
  // via https://assets.titrra.com/... which is what FB will fetch.
  const pathname = `social/facebook/${dateStamp}-${themeKey}.png`;
  const { url } = await put(pathname, buffer, {
    access: 'public',
    contentType: 'image/png',
  });

  return { url, pathname };
}
