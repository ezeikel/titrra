import { runSocialCron } from '../social/pipeline.js';

// CLI trigger for the social pipeline. `pnpm --filter @titrra/worker social:run`
// runs one post; pass --dry-run to generate the caption only (no image, no FB
// publish), or --theme=<substring> to force a specific theme.
const args = process.argv.slice(2);
const themeOverride = args.find((a) => a.startsWith('--theme='))?.split('=')[1];
const dryRun = args.includes('--dry-run');

runSocialCron({ themeOverride, dryRun })
  .then((result) => {
    console.log('[run-social] done:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('[run-social] failed:', err);
    process.exit(1);
  });
