import { defineConfig } from 'vitest/config';

// Unit tests for the worker's pure logic (topic selection/dedupe + the
// markdown → Portable Text converter). The pipelines that hit the network
// (AI, Sanity, Facebook, R2) are exercised manually via `blog:run --dry-run`
// and `social:run --dry-run`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
