export async function runStudentReleaseJourney(page) {
  const initialProfile = await page.request.get('/api/account/onboarding');
  if (!initialProfile.ok() || JSON.stringify(await initialProfile.json()) !== '{"profile":null}') {
    throw new Error('Student release fixture did not start with an empty profile.');
  }
  await page.goto('/programmes');
  const programmeResults = page.getByRole('region', { name: 'Programme results' });
  await programmeResults.waitFor();
  if (!(await programmeResults.textContent())?.includes('E2E Applied Health Pathway')) {
    throw new Error('Student release fixture did not expose the governed programme.');
  }
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
  await page.getByText('Your pathway snapshot').waitFor();

  const savedProfile = await page.request.get('/api/account/onboarding');
  const profile = await savedProfile.json();
  if (
    !savedProfile.ok() ||
    profile?.profile?.interests?.[0] !== 'technology' ||
    profile?.profile?.pathwayPreference !== 'certificate-program'
  ) {
    throw new Error('Student onboarding profile did not persist.');
  }

  await page.goto('/programmes');
  await page.getByText('Sorted by your saved preferences.').waitFor();
  await page.getByRole('button', { name: 'Save to shortlist' }).first().click();
  await page.getByRole('button', { name: 'Saved to shortlist' }).first().waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Saved to shortlist' }).first().waitFor();

  await page.goto('/recommendations');
  await page.getByText('Your next-step recommendations').waitFor();

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
  await page.getByText('Simulation complete').waitFor();
}
