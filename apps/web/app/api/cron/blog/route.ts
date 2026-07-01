import { NextResponse } from 'next/server';
import { postToWorker } from '@/lib/worker';

// Vercel cron hits this weekly (see vercel.json). It authenticates the cron
// caller, then hands off to the worker's /generate/blog (which drafts one
// GLP-1 post into Sanity for human review). Vercel auto-sends CRON_SECRET as a
// bearer on scheduled invocations.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await postToWorker('/generate/blog', {});
    if (!res.ok) {
      return NextResponse.json(
        { error: 'worker rejected', status: res.status },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { success: true, accepted: true, message: 'blog cron handed off' },
      { status: 202 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'worker unreachable' },
      { status: 502 },
    );
  }
}
