import type { Page } from '@playwright/test';

// Seed local state so a spec can start as an already-onboarded user, skipping
// the quiz. Mirrors what the onboarding "building" step writes (markOnboarded).
export const seedOnboarded = async (
  page: Page,
  opts: { name?: string; bodyShape?: 'MALE' | 'FEMALE' | 'UNSPECIFIED' } = {},
) => {
  await page.addInitScript(
    ({ name, bodyShape }) => {
      localStorage.setItem('titrra.onboarded', 'true');
      localStorage.setItem('titrra.name', name);
      localStorage.setItem('titrra.bodyShape', bodyShape);
    },
    { name: opts.name ?? 'Test', bodyShape: opts.bodyShape ?? 'UNSPECIFIED' },
  );
};

// Wipe local state so a spec runs the onboarding flow from scratch.
export const seedFresh = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
};
