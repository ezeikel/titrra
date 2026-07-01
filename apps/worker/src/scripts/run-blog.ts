import { runBlogCron } from '../blog/pipeline.js';

// CLI trigger for the blog pipeline. `pnpm --filter @titrra/worker blog:run`
// runs one generation; pass --dry-run to skip the Sanity write, or
// --topic=<substring> to force a specific topic.
const args = process.argv.slice(2);
const topicOverride = args.find((a) => a.startsWith('--topic='))?.split('=')[1];
const dryRun = args.includes('--dry-run');

runBlogCron({ topicOverride, dryRun })
  .then(() => {
    console.log('[run-blog] done');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[run-blog] failed:', err);
    process.exit(1);
  });
