import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests for the web app's pure logic that needs no DOM or Next runtime —
// currently the GLP-1 drug metadata lookup. Component + flow behaviour is
// covered by Playwright (e2e/), so a Node environment is all we need here.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});
