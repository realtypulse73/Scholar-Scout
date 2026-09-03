/** @jest-environment node */

import { POST } from '@/app/api/admin/programmes/route';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  ProgrammeRevisionConflictError,
  saveProgrammeRecord,
} from '@/lib/server/programme-records';
import { programmes, type Programme } from '@/lib/programmes';

jest.mock('@/lib/server/active-staff', () => ({ requireActiveStaff: jest.fn() }));
jest.mock('@/lib/server/programme-records', () => ({
  deleteProgrammeRecord: jest.fn(),
  ProgrammeRevisionConflictError: class ProgrammeRevisionConflictError extends Error {
    constructor(
      readonly programmeId: string,
      readonly currentRevision: number,
      readonly currentRecord: unknown,
    ) {
      super('conflict');
    }
  },
  saveProgrammeRecord: jest.fn(),
}));

describe('admin programme CAS conflicts', () => {
  it('keeps the authorized stale-write response safe and free of provider tokens', async () => {
    jest.mocked(requireActiveStaff).mockResolvedValue({
      ok: true,
      actor: { id: 'staff-1', email: 'staff@example.com' },
    } as never);
    const current: Programme = {
      ...programmes[0],
      revision: 2,
      publicationStatus: 'draft',
      sourceConfidence: 'unverified',
      sourceChecks: [],
    };
    jest.mocked(saveProgrammeRecord).mockRejectedValue(
      new ProgrammeRevisionConflictError(current.id, 2, current),
    );
    const response = await POST(new Request('http://localhost/api/admin/programmes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...current, revision: 1 }),
    }));
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body).toMatchObject({ currentRevision: 2, currentRecord: current });
    expect(JSON.stringify(body)).not.toMatch(/etag|version token|if-match/i);
  });
});
