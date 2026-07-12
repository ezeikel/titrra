import { NextResponse } from 'next/server';
import { postToWorker } from '@/lib/worker';

// Vercel cron hits this on a schedule (see vercel.json). It authenticates the
// cron caller, then hands off to the worker's /generate/social (which writes a
// compliant caption + gpt-image-2 image to R2 and publishes it to the Titrra
// Facebook Page). Vercel auto-sends CRON_SECRET as a bearer on scheduled
// invocations. Unlike the blog, social posts publish live (no draft gate).
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await postToWorker('/generate/social', {});
    if (!res.ok) {
      return NextResponse.json(
        { error: 'worker rejected', status: res.status },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { success: true, accepted: true, message: 'social cron handed off' },
      { status: 202 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'worker unreachable' },
      { status: 502 },
    );
  }
}
