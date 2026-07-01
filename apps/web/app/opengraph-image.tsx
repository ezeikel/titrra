import { OG_HEIGHT, OG_WIDTH } from '@/lib/og/constants';
import { renderSiteOG } from '@/lib/og/render';

// Site-default OG image. Because this file exists, Next auto-attaches it as the
// default og:image / twitter:image for every page that doesn't set its own —
// so the root layout must NOT set an images field.
export const runtime = 'nodejs';
export const alt = 'Titrra — the focused GLP-1 tracker';
export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = 'image/png';

export default async function Image() {
  return renderSiteOG({
    title: 'Stay on track with every dose',
    subtitle: 'Log doses, rotate sites, follow your titration ladder.',
  });
}
