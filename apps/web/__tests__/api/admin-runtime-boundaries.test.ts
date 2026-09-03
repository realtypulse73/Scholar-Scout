/** @jest-environment node */

import { dynamic as communityModerationDynamic } from '@/app/admin/community-moderation/page';
import { dynamic as feedDynamic } from '@/app/admin/feed/page';
import { dynamic as opsDynamic } from '@/app/admin/ops/page';

describe('server-authorized admin pages', () => {
  it.each([
    ['/admin/community-moderation', communityModerationDynamic],
    ['/admin/feed', feedDynamic],
    ['/admin/ops', opsDynamic],
  ])('renders %s only for a request', (_route, dynamic) => {
    expect(dynamic).toBe('force-dynamic');
  });
});
