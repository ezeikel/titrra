// Loads Titrra's brand fonts (Bricolage Grotesque for display, Inter for body)
// straight from Google Fonts for use in a Next.js OG ImageResponse — no local
// .ttf files needed. We fetch the css2 stylesheet, pull the woff2 URL out, and
// return the font bytes. Module-scoped promise cache so repeated OG renders in
// the same lambda reuse the fetch.

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700 | 800;
  style: 'normal';
};

type FontSpec = {
  family: string; // Google Fonts family name
  name: string; // font-family used in the JSX
  weight: OgFont['weight'];
  // A short text sample so Google returns a subset covering our glyphs; we ask
  // for the Latin range broadly via a representative string.
  text: string;
};

const SAMPLE =
  'Titrra Stay on track with every dose — GLP-1 tracker 0123456789 .,:';

const FONTS: FontSpec[] = [
  {
    family: 'Bricolage Grotesque',
    name: 'Bricolage',
    weight: 800,
    text: SAMPLE,
  },
  {
    family: 'Bricolage Grotesque',
    name: 'Bricolage',
    weight: 700,
    text: SAMPLE,
  },
  { family: 'Inter', name: 'Inter', weight: 600, text: SAMPLE },
  { family: 'Inter', name: 'Inter', weight: 400, text: SAMPLE },
];

async function fetchGoogleFont(spec: FontSpec): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    spec.family,
  )}:wght@${spec.weight}&text=${encodeURIComponent(spec.text)}`;
  // A modern UA makes Google serve woff2 (the format satori/resvg reads).
  const css = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  }).then((r) => r.text());

  const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:woff2|woff)'\)/);
  if (!match) throw new Error(`No font URL in css2 for ${spec.family}`);
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

let cached: Promise<OgFont[]> | null = null;

export function loadOgFonts(): Promise<OgFont[]> {
  if (!cached) {
    cached = Promise.all(
      FONTS.map(async (spec) => ({
        name: spec.name,
        data: await fetchGoogleFont(spec),
        weight: spec.weight,
        style: 'normal' as const,
      })),
    );
  }
  return cached;
}
