jest.mock('@/lib/server/data-store', () => ({
  readVersionedScholarScoutData: jest.fn(),
  writeVersionedScholarScoutData: jest.fn(),
}));

import {
  readVersionedScholarScoutData,
  writeVersionedScholarScoutData,
  type ScholarScoutData,
} from '@/lib/server/data-store';
import { commitConditionalMutation } from '@/lib/server/persistence-operations';

describe('commitConditionalMutation', () => {
  it('retries one version collision against a fresh snapshot', async () => {
    const firstData = { auditEvents: [] } as unknown as ScholarScoutData;
    const secondData = { auditEvents: [{}] } as unknown as ScholarScoutData;
    jest.mocked(readVersionedScholarScoutData)
      .mockResolvedValueOnce({ data: firstData, version: 'one' } as never)
      .mockResolvedValueOnce({ data: secondData, version: 'two' } as never);
    jest.mocked(writeVersionedScholarScoutData)
      .mockResolvedValueOnce({ status: 'conflict' } as never)
      .mockResolvedValueOnce({ status: 'applied', version: 'three' } as never);

    const result = await commitConditionalMutation((data) => ({ auditEventCount: data.auditEvents.length }));

    expect(result).toEqual({ status: 'applied', value: { auditEventCount: 1 } });
    expect(writeVersionedScholarScoutData).toHaveBeenNthCalledWith(1, firstData, 'one');
    expect(writeVersionedScholarScoutData).toHaveBeenNthCalledWith(2, secondData, 'two');
  });
});
