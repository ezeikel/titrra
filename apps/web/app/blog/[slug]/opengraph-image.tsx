import { OG_HEIGHT, OG_WIDTH } from '@/lib/og/constants';
import { renderSiteOG } from '@/lib/og/render';
import { getPostBySlug } from '@/lib/seo/blog';

export const runtime = 'nodejs';
export const alt = 'Titrra GLP-1 guide';
export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return renderSiteOG({
    eyebrow: 'GLP-1 Guide',
    title: post?.title ?? 'Titrra Blog',
    subtitle: post?.excerpt,
  });
}
