// Sentry must be imported first — it patches the runtime on init, so this
// import has to stay above the others. The ignore stops Biome's import sorter
// from alphabetising it back down.
// biome-ignore assist/source/organizeImports: Sentry must be imported first
import { Sentry } from './instrument.js';
import { serve } from '@hono/node-server';
import { type Context, Hono } from 'hono';
import { logger } from 'hono/logger';
import { runBlogCron } from './blog/pipeline.js';
import { runSocialCron } from './social/pipeline.js';

// Titrra content worker. Runs on the shared Hetzner box (port 3070) as the
// `titrra-worker` systemd service. Its first job is AI blog generation for the
// SEO engine; image-gen / AI-UGC land here later. Env is loaded by tsx's
// --env-file locally and by systemd's EnvironmentFile on the box.

const app = new Hono();
app.use('*', logger());

app.onError((err, c) => {
  console.error(`[onError] ${c.req.method} ${c.req.path}:`, err);
  Sentry.captureException(err);
  return c.json(
    { error: err instanceof Error ? err.message : 'Internal server error' },
    500,
  );
});

// Bearer auth for the privileged endpoints — only trusted callers (Vercel
// cron, the web app) may trigger generation. Sent as
// `Authorization: Bearer <WORKER_SECRET>`. Unset secret = open (local dev).
// /health stays unauthenticated + lightweight.
const bearerAuth = async (
  c: Context,
  next: () => Promise<void>,
): Promise<Response | void> => {
  const secret = process.env.WORKER_SECRET;
  if (!secret) return next();
  if (c.req.header('authorization') !== `Bearer ${secret}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return next();
};
app.use('/generate/*', bearerAuth);
app.use('/publish/*', bearerAuth);

app.get('/health', (c) => c.json({ status: 'ok', service: 'titrra-worker' }));

// POST /generate/blog — draft a GLP-1 blog post into Sanity. Fire-and-forget:
// ack immediately (the caller — Vercel cron — has a short function budget) and
// run the generation in the background. The post lands as a DRAFT for review.
app.post('/generate/blog', (c) => {
  console.log('[/generate/blog] kickoff');
  runBlogCron().catch((err) =>
    console.error('[/generate/blog] uncaught:', err),
  );
  return c.json({ ok: true, accepted: true }, 202);
});

// POST /generate/social — generate + publish one Facebook photo post
// (compliant caption + gpt-image-2 image hosted on R2 → FB Page /photos).
// Fire-and-forget: ack immediately, run in the background. Unlike the blog,
// social posts publish live (no human-review gate) — that's the point of an
// auto-poster. The theme copy/art is constrained to be utility-only (no weight
// / outcome / efficacy claims), see social/topics.ts.
app.post('/generate/social', (c) => {
  console.log('[/generate/social] kickoff');
  runSocialCron().catch((err) =>
    console.error('[/generate/social] uncaught:', err),
  );
  return c.json({ ok: true, accepted: true }, 202);
});

const port = parseInt(process.env.PORT ?? '3070', 10);
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => {
  console.log(`[titrra-worker] listening on http://0.0.0.0:${port}`);
});
