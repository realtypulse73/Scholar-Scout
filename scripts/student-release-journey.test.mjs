import assert from 'node:assert/strict';
import test from 'node:test';

import {
  runStudentReleaseJourney,
  STUDENT_RELEASE_JOURNEY_TIMEOUT_MS,
  STUDENT_RELEASE_JOURNEY_COMPLETE_HEADING,
  STUDENT_RELEASE_JOURNEY_RECOMMENDATIONS_HEADING,
  StudentReleaseJourneyError,
} from './student-release-journey.mjs';

test('uses the current accessible completion heading from onboarding', () => {
  assert.equal(STUDENT_RELEASE_JOURNEY_COMPLETE_HEADING.test("You're all set!"), true);
  assert.equal(STUDENT_RELEASE_JOURNEY_COMPLETE_HEADING.test('Your pathway snapshot'), false);
});

test('uses the current accessible recommendation heading', () => {
  assert.equal(STUDENT_RELEASE_JOURNEY_RECOMMENDATIONS_HEADING, 'Your best next move');
});

test('gives the hosted Preview student journey a bounded cold-start timeout', async () => {
  const timeouts = [];
  const expectedStop = new Error('stop after timeout configuration');
  const page = {
    setDefaultTimeout: (value) => { timeouts.push(['default', value]); },
    setDefaultNavigationTimeout: (value) => { timeouts.push(['navigation', value]); },
    request: {
      get: async () => { throw expectedStop; },
    },
  };

  await assert.rejects(
    () => runStudentReleaseJourney(page),
    (error) => error instanceof StudentReleaseJourneyError && error.cause === expectedStop,
  );
  assert.deepEqual(timeouts, [
    ['default', STUDENT_RELEASE_JOURNEY_TIMEOUT_MS],
    ['navigation', STUDENT_RELEASE_JOURNEY_TIMEOUT_MS],
  ]);
});

test('reports the safe journey stage without exposing the underlying browser failure', async () => {
  const page = {
    setDefaultTimeout: () => undefined,
    setDefaultNavigationTimeout: () => undefined,
    request: {
      get: async () => { throw new Error('sensitive fixture detail'); },
    },
  };

  await assert.rejects(
    () => runStudentReleaseJourney(page),
    (error) => error instanceof StudentReleaseJourneyError && error.stage === 'profile-read' && !error.message.includes('sensitive'),
  );
});

test('reports the safe onboarding interaction stage without exposing the underlying browser failure', async () => {
  const sensitiveStop = new Error('sensitive browser detail');
  const page = {
    setDefaultTimeout: () => undefined,
    setDefaultNavigationTimeout: () => undefined,
    request: {
      get: async () => ({
        ok: () => true,
        json: async () => ({ profile: null }),
      }),
    },
    goto: async () => undefined,
    getByRole: (_role, options) => {
      if (options?.name === 'Programme results') {
        return {
          waitFor: async () => undefined,
          textContent: async () => 'E2E Applied Health Pathway',
        };
      }

      return { click: async () => { throw sensitiveStop; } };
    },
  };

  await assert.rejects(
    () => runStudentReleaseJourney(page),
    (error) =>
      error instanceof StudentReleaseJourneyError &&
      error.stage === 'onboarding-interest' &&
      !error.message.includes('sensitive'),
  );
});
