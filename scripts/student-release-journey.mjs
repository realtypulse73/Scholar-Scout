export const STUDENT_RELEASE_JOURNEY_TIMEOUT_MS = 60_000;
export const STUDENT_RELEASE_JOURNEY_COMPLETE_HEADING = /you['’]re all set/i;
export const STUDENT_RELEASE_JOURNEY_RECOMMENDATIONS_HEADING = 'Your best next move';

export class StudentReleaseJourneyError extends Error {
  constructor(stage, cause) {
    const interaction = classifyJourneyInteraction(cause);
    super(`Student release journey failed during ${stage} (${interaction}).`);
    this.name = 'StudentReleaseJourneyError';
    this.stage = stage;
    this.interaction = interaction;
    this.cause = cause;
  }
}

function classifyJourneyInteraction(cause) {
  const message = cause instanceof Error ? cause.message : '';
  if (message.includes('strict mode violation')) return 'ambiguous';
  if (message.includes('intercepts pointer events')) return 'blocked';
  if (message.includes('Timeout')) return 'timeout';
  return 'failed';
}

/**
 * Runs the Preview student path with enough time for a cold serverless Preview
 * deployment to respond, without weakening application assertions.
 */
export async function runStudentReleaseJourney(
  page,
  { timeoutMs = STUDENT_RELEASE_JOURNEY_TIMEOUT_MS } = {},
) {
  page.setDefaultTimeout(timeoutMs);
  page.setDefaultNavigationTimeout(timeoutMs);
  let stage = 'profile-read';
  try {
    const initialProfile = await page.request.get('/api/account/onboarding');
    if (!initialProfile.ok() || JSON.stringify(await initialProfile.json()) !== '{"profile":null}') {
      throw new Error('Student release fixture did not start with an empty profile.');
    }
    stage = 'catalogue';
    await page.goto('/programmes');
    const programmeResults = page.getByRole('region', { name: 'Programme results' });
    await programmeResults.waitFor();
    if (!(await programmeResults.textContent())?.includes('E2E Applied Health Pathway')) {
      throw new Error('Student release fixture did not expose the governed programme.');
    }
    stage = 'onboarding-open';
    await page.goto('/onboarding');
    const onboardingPanel = page.locator('main > div > section');
    stage = 'onboarding-interest';
    await onboardingPanel.getByRole('button', { name: 'Technology & IT' }).click();
    stage = 'onboarding-pathway';
    await onboardingPanel.getByRole('button', { name: 'Certificate Program' }).click();
    stage = 'onboarding-next-one';
    await onboardingPanel.getByRole('button', { name: 'Next', exact: true }).click();
    stage = 'onboarding-gpa';
    await onboardingPanel.getByRole('button', { name: '3.0 – 3.4' }).click();
    stage = 'onboarding-location';
    await onboardingPanel.getByRole('button', { name: 'Close to Home (< 30 mi)' }).click();
    stage = 'onboarding-next-two';
    await onboardingPanel.getByRole('button', { name: 'Next', exact: true }).click();
    stage = 'onboarding-support';
    await onboardingPanel.getByRole('button', { name: 'Financial Aid & Scholarships' }).click();
    stage = 'onboarding-next-three';
    await onboardingPanel.getByRole('button', { name: 'Next', exact: true }).click();
    stage = 'onboarding-save';
    await onboardingPanel.getByRole('button', { name: 'Save profile' }).click();
    stage = 'onboarding-complete';
    await page.getByRole('heading', { name: STUDENT_RELEASE_JOURNEY_COMPLETE_HEADING }).waitFor();

    stage = 'onboarding-persist';
    const savedProfile = await page.request.get('/api/account/onboarding');
    const profile = await savedProfile.json();
    if (
      !savedProfile.ok() ||
      profile?.profile?.interests?.[0] !== 'technology' ||
      profile?.profile?.pathwayPreference !== 'certificate-program'
    ) {
      throw new Error('Student onboarding profile did not persist.');
    }

    stage = 'shortlist';
    await page.goto('/programmes');
    await page.getByText('Sorted by your saved preferences.').waitFor();
    await page.getByRole('button', { name: 'Save to shortlist' }).first().click();
    await page.getByRole('button', { name: 'Saved to shortlist' }).first().waitFor();
    await page.reload();
    await page.getByRole('button', { name: 'Saved to shortlist' }).first().waitFor();

    stage = 'recommendations';
    await page.goto('/recommendations');
    await page.getByRole('heading', { name: STUDENT_RELEASE_JOURNEY_RECOMMENDATIONS_HEADING }).waitFor();

    stage = 'simulation';
    await page.goto('/simulate');
    const simulationPanel = page.locator('main > div > div > div > section').nth(1);
    const simulationChoices = simulationPanel.locator('div.grid.gap-3');
    for (let step = 0; step < 6; step += 1) {
      await simulationChoices.getByRole('button').first().click();
      const finish = page.getByRole('button', { name: 'Finish simulation' });
      if (await finish.count()) {
        await finish.click();
        break;
      }
      await simulationPanel.getByRole('button', { name: 'Next', exact: true }).click();
    }
    await page.getByText('Simulation complete').waitFor();
  } catch (cause) {
    if (cause instanceof StudentReleaseJourneyError) throw cause;
    throw new StudentReleaseJourneyError(stage, cause);
  }
}
