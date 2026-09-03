import { expect, test } from '@playwright/test';

test('a guest student completes the release journey', async ({ page }) => {
  const bootstrap = await page.request.get('/api/account/onboarding');
  expect(bootstrap.ok()).toBe(true);
  await expect(bootstrap.json()).resolves.toEqual({ profile: null });

  await page.goto('/programmes');
  await expect(
    page.getByRole('heading', { name: 'Programmes worth exploring' }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Programme results' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Generated Technology Pathway' }).first(),
  ).toBeVisible();

  const shortlistButton = page.getByRole('button', { name: 'Save to shortlist' }).first();
  await shortlistButton.click();
  await expect(page.getByRole('button', { name: 'Saved to shortlist' }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Saved to shortlist' }).first()).toBeVisible();

  await page.goto('/onboarding');
  await page.getByRole('button', { name: 'Technology' }).click();
  await page.getByRole('button', { name: 'Online degree' }).click();
  await page.getByRole('button', { name: 'Continue to next step' }).click();
  await page.getByRole('button', { name: '3.0 – 3.4' }).click();
  await page.getByRole('button', { name: 'In-State' }).click();
  await page.getByRole('button', { name: 'Continue to next step' }).click();
  await page.getByRole('button', { name: /balanced/i }).click();
  await page.getByRole('button', { name: 'Career counseling' }).click();
  await page.getByRole('button', { name: 'Continue to next step' }).click();
  await page.getByRole('button', { name: 'Save my pathway profile' }).click();
  await expect(
    page.getByRole('heading', { name: "You're all set! 🎉" }),
  ).toBeVisible();

  const profileResponse = await page.request.get('/api/account/onboarding');
  expect(profileResponse.ok()).toBe(true);
  await expect(profileResponse.json()).resolves.toEqual({
    profile: expect.any(Object),
  });

  await page.goto('/recommendations');
  await expect(
    page.getByRole('heading', { name: 'Your best next move' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Generated Technology Pathway' }).first(),
  ).toBeVisible();

  await page.goto('/simulate');
  await page.getByRole('button', {
    name: 'Inspect the labeled electrical panel and lockout area first.',
  }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', {
    name: 'Remove the damaged cord, tag it out, and route a safer temporary line.',
  }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', {
    name: 'Solving real physical problems with tools and skill.',
  }).click();
  await page.getByRole('button', { name: 'Finish simulation' }).click();
  await expect(page.getByText('Simulation complete')).toBeVisible();
});
