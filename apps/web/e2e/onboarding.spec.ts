import { expect, test } from '@playwright/test';
import { seedFresh } from './helpers/app';

// Full onboarding flow: a fresh user walks the quiz end-to-end and lands on the
// Today screen with their plan committed. Guards the gating (a non-onboarded
// user is sent to /onboarding) and the step wiring.
test('onboarding: fresh user completes the quiz and reaches Today', async ({
  page,
}) => {
  const fatal: string[] = [];
  page.on('pageerror', (e) => fatal.push(`PAGEERROR: ${e.message}`));

  await seedFresh(page);

  // Root gates to onboarding for a non-onboarded user.
  await page.goto('/');
  await expect(page).toHaveURL(/\/onboarding\/name/);

  // Name. Wait for each step's heading before interacting so a router.push
  // navigation can never race the next click onto the previous page.
  await expect(
    page.getByRole('heading', { name: /what should we call you/i }),
  ).toBeVisible();
  await page.getByPlaceholder('Your name').fill('Ada');
  await page.getByRole('button', { name: /^Continue$/ }).click();

  // Medication — pick Mounjaro.
  await expect(
    page.getByRole('heading', { name: /which medication are you on/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Mounjaro/ }).click();
  await page.getByRole('button', { name: /^Continue$/ }).click();

  // Current dose — pick the first rung (2.5 mg). exact: avoids matching 12.5 mg.
  await expect(
    page.getByRole('heading', { name: /what dose are you on now/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: '2.5 mg', exact: true }).click();
  await page.getByRole('button', { name: /^Continue$/ }).click();

  // Goal dose — pick a higher rung (10 mg), ladder preview appears.
  await expect(
    page.getByRole('heading', { name: /where are you headed/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: '10 mg', exact: true }).click();
  // Exact match: the subtitle also contains "your titration ladder".
  await expect(
    page.getByText('Your titration ladder', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Continue$/ }).click();

  // Weight — skip.
  await expect(
    page.getByRole('heading', { name: /your starting weight/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: /skip for now/i }).click();

  // Side effects — none.
  await expect(
    page.getByRole('heading', { name: /dealing with any of these/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: /none right now/i }).click();

  // Body shape — choose Feminine.
  await expect(
    page.getByRole('heading', { name: /which body would you like to see/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Feminine/ }).click();
  await page.getByRole('button', { name: /^Continue$/ }).click();

  // Reminders — maybe later.
  await expect(
    page.getByRole('heading', { name: /want a nudge on shot day/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: /maybe later/i }).click();

  // Building runs the commit, then reveal shows the plan recap.
  await expect(
    page.getByRole('heading', { name: /your Titrra plan is ready/i }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Mounjaro')).toBeVisible();

  // Hand off to the app → Today screen.
  await page.getByRole('button', { name: /see my plan/i }).click();
  await expect(
    page.getByRole('heading', { name: /log today.s shot/i }),
  ).toBeVisible();

  expect(fatal, fatal.join('\n')).toEqual([]);
});
