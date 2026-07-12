import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { postPhotoToFacebookPage } from './facebook.js';
import { generateSocialImage } from './image.js';
import { pickSocialTheme } from './topics.js';

const model = anthropic('claude-sonnet-5');

// Em dashes read as AI-generated; house style bans them (same rule as the blog).
const stripEmDashes = (s: string): string =>
  s.replace(/\s*—\s*/g, ', ').replace(/—/g, '-');

// Trim to a clean Facebook status: collapse whitespace, drop wrapping quotes the
// model sometimes adds, keep it status-length.
const sanitizeCaption = (s: string): string =>
  stripEmDashes(s)
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const CAPTION_SYSTEM = `You are the Facebook voice of Titrra, a calm, premium GLP-1 medication TRACKER app (semaglutide/tirzepatide: Ozempic, Wegovy, Mounjaro, Zepbound).

Write ONE Facebook status update. Style: warm, human, native to the feed, scroll-stopping but never hypey. A hook first line, a little empathy, then the calm way Titrra helps, then a soft CTA. Under 120 words. 0-2 relevant hashtags max.

Titrra is a TRACKING UTILITY, not a medical product. You are selling the ROUTINE (organised dose logging, injection-site rotation, titration-ladder clarity, side-effect notes, calm consistency), NEVER the outcome.

HARD RULES (compliance — breaking these gets the post rejected):
- Never promise, imply, or reference weight loss, results, outcomes, or "before/after".
- Never make efficacy claims about any medication.
- Never give dose instructions or any medical advice; always defer to the user's clinician.
- Never use em dashes (—); use commas or restructure.
- Do not invent statistics, studies, testimonials, ratings, or review counts.
- No fear-mongering, no food shaming, no body talk.

CTA: point to the app gently (e.g. "Track your routine with Titrra." or "titrra.com"). Never overpromise.`;

type RunSocialOpts = { themeOverride?: string; dryRun?: boolean };

export type SocialRunResult = {
  themeKey: string;
  caption: string;
  imageUrl: string;
  facebookPhotoId?: string;
  facebookPostId?: string;
  dryRun: boolean;
};

// Generate + publish one Facebook photo post: pick a compliant theme, write a
// caption (Claude), render an image (gpt-image-2) hosted on R2, then post it to
// the Titrra Page. dryRun skips both the image upload's publish and the FB call.
export async function runSocialCron(
  opts: RunSocialOpts = {},
): Promise<SocialRunResult> {
  const theme = pickSocialTheme(opts.themeOverride);
  console.log(`[social] theme: ${theme.key}`);

  // CAPTION
  const { text: rawCaption } = await generateText({
    model,
    system: CAPTION_SYSTEM,
    prompt: `Post theme: ${theme.brief}\nWrite the Facebook status now.`,
  });
  const caption = sanitizeCaption(rawCaption);
  if (!caption) throw new Error('caption generation returned empty');

  if (opts.dryRun) {
    console.log(`[social] dryRun — caption:\n${caption}`);
    console.log('[social] dryRun — skipping image gen + FB publish');
    return {
      themeKey: theme.key,
      caption,
      imageUrl: '',
      dryRun: true,
    };
  }

  // IMAGE → R2 (public URL that FB will fetch)
  const dateStamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const { url: imageUrl } = await generateSocialImage(
    theme.key,
    theme.imageConcept,
    dateStamp,
  );
  console.log(`[social] image hosted: ${imageUrl}`);

  // PUBLISH to Facebook Page
  const fb = await postPhotoToFacebookPage(imageUrl, caption);
  console.log(`[social] published to FB: photo=${fb.id} post=${fb.postId}`);

  return {
    themeKey: theme.key,
    caption,
    imageUrl,
    facebookPhotoId: fb.id,
    facebookPostId: fb.postId,
    dryRun: false,
  };
}
