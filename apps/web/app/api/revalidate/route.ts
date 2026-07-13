import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/revalidate
 *
 * Busts the blog cache tags so newly published posts appear on the site within
 * seconds (no deploy). Called by the content worker immediately after it
 * publishes a post to Sanity, authenticated with the shared CRON_SECRET bearer.
 * The blog list page caches with `cacheTag('blog-list', 'blog-posts')`, so we
 * revalidate those here.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 500 },
    );
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidateTag('blog-list', 'max');
  revalidateTag('blog-posts', 'max');

  return NextResponse.json({
    revalidated: true,
    tags: ['blog-list', 'blog-posts'],
  });
}
