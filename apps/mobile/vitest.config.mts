import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Minimal config for unit-testing PURE logic only (no RN runtime). Tests must
// `import type` anything from RN-backed modules so nothing native loads at
// runtime. Flow-level behaviour is covered by Maestro (.maestro/).
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
