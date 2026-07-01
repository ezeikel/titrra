import { OG_HEIGHT, OG_WIDTH } from '@/lib/og/constants';
import { renderSiteOG } from '@/lib/og/render';
import { getGlp1PageBySlug } from '@/lib/seo/glp1-pages';

export const runtime = 'nodejs';
export const alt = 'Titrra GLP-1 tracker';
export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ drug: string }>;
}) {
  const { drug } = await params;
  const page = getGlp1PageBySlug(drug);
  return renderSiteOG({
    eyebrow: page?.generic ?? 'GLP-1 tracker',
    title: page ? `The ${page.label} tracker` : 'Titrra',
    subtitle: 'Log doses, rotate sites, follow your titration ladder.',
  });
}
