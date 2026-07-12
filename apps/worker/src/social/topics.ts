// Social post themes for Titrra's Facebook Page. Each theme drives one AI
// caption + one AI image. Unlike the blog (which dedupes against a fixed topic
// set), social posts recycle themes freely — the same theme can post many times
// with fresh copy/art, so there's no idempotency key here.
//
// COMPLIANCE (non-negotiable — see CLAUDE.md "Compliance guardrails"):
// Titrra is a TRACKING UTILITY, not a medical product. Social copy + art must
// be UTILITY-first and must NEVER:
//   - promise or imply weight loss / outcomes / results / "before-after"
//   - make efficacy claims about any medication
//   - give dose instructions or medical advice
//   - show a scale, a shrinking body, food-shaming, or a "results" framing
// The product value is: organised dose logging, injection-site rotation,
// titration-ladder clarity, side-effect notes, calm consistency. Sell the
// ROUTINE, never the outcome.

export type SocialTheme = {
  key: string;
  // One-line brief the caption model expands into a Facebook status.
  brief: string;
  // The visual concept the image model renders. Keep it clean, warm, premium,
  // teal/sand health aesthetic — an app-adjacent lifestyle still, NOT a person
  // losing weight and NOT a clinical/graphic injection close-up.
  imageConcept: string;
};

export const SOCIAL_THEMES: SocialTheme[] = [
  {
    key: 'injection-site-rotation',
    brief:
      'Rotating injection sites is easy to lose track of. Titrra remembers your last site so you can rotate with confidence. Utility, calm, no medical advice.',
    imageConcept:
      'A soft, premium flat-lay in warm teal and sand tones: a phone showing a simple body-map with gentle dots marking rotation, beside a tidy notebook and a cup of tea on a light linen surface. Calm morning light. No human body detail, no needles shown, no clinical feel.',
  },
  {
    key: 'titration-ladder-clarity',
    brief:
      'Your titration ladder is your plan, not a guessing game. Titrra lays out where you are and what your clinician set next, so dose weeks feel clear. No dose advice, just clarity.',
    imageConcept:
      'A clean, minimal illustration of a gentle ascending set of steps rendered as a calm progress ladder, in teal and warm sand, on a soft off-white background. Abstract and reassuring, like a wellness app graphic. No text, no medication, no bodies.',
  },
  {
    key: 'consistency-routine',
    brief:
      'Consistency beats intensity. A weekly dose is easier to keep when it lives in one calm place. Titrra keeps your routine gently on track. Warm, supportive, no outcome claims.',
    imageConcept:
      'A serene lifestyle still: a phone on a bedside table beside a small plant and a glass of water, soft morning light through a window, warm teal and sand palette. The mood is calm and organised. No people, no medication, no scale.',
  },
  {
    key: 'side-effect-notes',
    brief:
      'Noticing how you feel week to week helps you have better conversations with your clinician. Titrra makes it easy to jot a quick side-effect note. Supports the clinician relationship, never replaces it.',
    imageConcept:
      'A cosy flat-lay: an open journal with a soft pen, a mug of herbal tea, and a phone showing a simple friendly note screen, on a warm linen background in teal and sand tones. Gentle and reflective. No people, no medication, no medical imagery.',
  },
  {
    key: 'dose-day-reminder',
    brief:
      'Dose day should never sneak up on you. Titrra gives a calm nudge so your weekly rhythm stays steady. Reassuring utility, no medical advice, no outcome talk.',
    imageConcept:
      'A minimal, premium phone-on-desk scene with a soft calendar/reminder motif, warm teal and sand palette, clean light background, a small sprig of greenery. Calm and uncluttered. No people, no medication, no numbers implying weight.',
  },
  {
    key: 'one-calm-place',
    brief:
      'Doses, sites, side effects, and your ladder, all in one calm place instead of scattered notes. Titrra brings your GLP-1 routine together. Organisation-first, no claims.',
    imageConcept:
      'A tidy, aesthetic desk flat-lay suggesting "everything in one place": a phone, a small notebook, a pen, a plant, arranged neatly on warm sand-toned linen with teal accents, soft natural light. Calm and premium. No people, no medication.',
  },
];

export function pickSocialTheme(override?: string): SocialTheme {
  if (override) {
    const found = SOCIAL_THEMES.find((t) => t.key.includes(override));
    if (found) return found;
  }
  return SOCIAL_THEMES[Math.floor(Math.random() * SOCIAL_THEMES.length)];
}
