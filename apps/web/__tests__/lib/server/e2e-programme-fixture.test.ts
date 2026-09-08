/** @jest-environment node */

import {
  createE2eProgrammeFixture,
  getE2eFixtureProgrammes,
} from '@/lib/server/e2e-programme-fixture';

describe('e2e programme fixture', () => {
  it('derives deterministic generated records from configured fixture state', () => {
    expect(createE2eProgrammeFixture('run-abc').map((programme) => programme.id)).toEqual([
      'e2e-run-abc-health',
      'e2e-run-abc-technology',
    ]);
    expect(getE2eFixtureProgrammes('run-abc')).toHaveLength(2);
  });
});
