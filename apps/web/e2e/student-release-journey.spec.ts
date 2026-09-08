import { expect, test } from '@playwright/test';

test('a generated student completes the release journey through the browser context', async ({ page }) => {
  const initialProfile = await page.request.get('/api/account/onboarding');

  expect(initialProfile).toBeOK();
  await expect(initialProfile.json()).resolves.toEqual({ profile: null });

  await page.goto('/programmes');
  await expect(page.getByRole('region', { name: 'Programme results' })).toContainText(
    'E2E Applied Health Pathway',
  );

  await page.goto('/onboarding');
  await page.getByRole('button', { name: 'Technology & IT' }).click();
  await page.getByRole('button', { name: 'Certificate Program' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '3.0 – 3.4' }).click();
  await page.getByRole('button', { name: 'Close to Home (< 30 mi)' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Financial Aid & Scholarships' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Your pathway snapshot')).toBeVisible();

  const savedProfile = await page.request.get('/api/account/onboarding');

  expect(savedProfile).toBeOK();
  await expect(savedProfile.json()).resolves.toMatchObject({
    profile: {
      interests: ['technology'],
      pathwayPreference: 'certificate-program',
    },
  });

  await page.goto('/programmes');
  await expect(page.getByText('Sorted by your saved preferences.')).toBeVisible();
  await page.getByRole('button', { name: 'Save to shortlist' }).first().click();
  await expect(page.getByRole('button', { name: 'Saved to shortlist' }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Saved to shortlist' }).first()).toBeVisible();

  await page.goto('/recommendations');
  await expect(page.getByText('Your next-step recommendations')).toBeVisible();

  await page.goto('/simulate');
  for (let step = 0; step < 6; step += 1) {
    await page.locator('main button[type="button"]:has(span)').first().click();

    const finish = page.getByRole('button', { name: 'Finish simulation' });
    if (await finish.count()) {
      await finish.click();
      break;
    }

    await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByText('Simulation complete')).toBeVisible();
});
