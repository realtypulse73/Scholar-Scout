/** @jest-environment node */

import { dynamic as communityModerationDynamic } from '@/app/admin/community-moderation/page';
import { dynamic as commandCenterDynamic } from '@/app/admin/command-center/page';
import { dynamic as feedDynamic } from '@/app/admin/feed/page';
import { dynamic as opsDynamic } from '@/app/admin/ops/page';
import { dynamic as programmesDynamic } from '@/app/admin/programmes/page';

describe('server-authorized admin pages', () => {
  it.each([
    ['/admin/community-moderation', communityModerationDynamic],
    ['/admin/command-center', commandCenterDynamic],
    ['/admin/feed', feedDynamic],
    ['/admin/ops', opsDynamic],
    ['/admin/programmes', programmesDynamic],
  ])('renders %s only for a request', (_route, dynamic) => {
    expect(dynamic).toBe('force-dynamic');
  });
});
