import { defineConfig } from 'vitest/config';

// Unit tests for the shared, pure domain logic in @titrra/types — chiefly the
// injection-site rotation engine, which both web and mobile depend on, so a
// regression here breaks the signature feature on BOTH platforms. Pure
// functions, no DOM, no RN — a Node environment is all we need.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
