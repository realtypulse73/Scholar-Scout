import { test } from '@playwright/test';
import { runStudentReleaseJourney } from '../../../scripts/student-release-journey.mjs';

test('a generated student completes the release journey through the browser context', async ({ page }) => {
  await runStudentReleaseJourney(page);
});
