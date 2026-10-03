/** @jest-environment node */

import { dynamic as recommendationsDynamic } from '@/app/recommendations/page';

describe('governed programme pages', () => {
  it('reads recommendation data only while serving a request', () => {
    expect(recommendationsDynamic).toBe('force-dynamic');
  });
});
