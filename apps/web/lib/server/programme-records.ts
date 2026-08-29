import 'server-only';

import { getPublishedProgrammeRecords } from '@/lib/admin-programmes';
import { programmes, type Programme } from '@/lib/programmes';
import {
  createAuditEvent,
  getProgrammeRecords,
  readScholarScoutData,
} from '@/lib/server/data-store';
import { commitConditionalMutation } from '@/lib/server/persistence-operations';

export class ProgrammeRevisionConflictError extends Error {
  constructor(
    readonly programmeId: string,
    readonly currentRevision: number,
    readonly currentRecord: Programme | undefined,
  ) {
    super('Programme record has changed since it was loaded.');
    this.name = 'ProgrammeRevisionConflictError';
  }
}

export async function saveProgrammeRecord(userId: string, programme: Programme) {
  const result = await commitConditionalMutation((data) => {
    const existingIndex = data.programmeRecords.findIndex(
      (record) => record.id === programme.id,
    );
    const existingRecord = data.programmeRecords[existingIndex];
    if (existingIndex === -1) {
      data.programmeRecords.unshift({ ...programme, revision: 1 });
    } else {
      const currentRevision = existingRecord.revision ?? 0;
      const incomingRevision = programme.revision ?? 0;
      if (incomingRevision !== currentRevision) {
        throw new ProgrammeRevisionConflictError(
          programme.id,
          currentRevision,
          existingRecord,
        );
      }
      data.programmeRecords[existingIndex] = {
        ...programme,
        revision: currentRevision + 1,
      };
    }
    data.auditEvents.push(
      createAuditEvent(
        userId,
        existingIndex === -1 ? 'create' : 'update',
        'programme',
        programme.id,
      ),
    );
    return data.programmeRecords.find((record) => record.id === programme.id);
  });
  if (result.status === 'conflict') {
    const current = (await readScholarScoutData()).programmeRecords.find(
      (record) => record.id === programme.id,
    );
    throw new ProgrammeRevisionConflictError(
      programme.id,
      current?.revision ?? 0,
      current,
    );
  }
  return result.value;
}

export async function deleteProgrammeRecord(userId: string, programmeId: string) {
  const result = await commitConditionalMutation((data) => {
    data.programmeRecords = data.programmeRecords.filter(
      (record) => record.id !== programmeId,
    );
    data.auditEvents.push(
      createAuditEvent(userId, 'delete', 'programme', programmeId),
    );
  });
  if (result.status === 'conflict') {
    const current = (await readScholarScoutData()).programmeRecords.find(
      (record) => record.id === programmeId,
    );
    throw new ProgrammeRevisionConflictError(
      programmeId,
      current?.revision ?? 0,
      current,
    );
  }
}

export async function getGovernedProgrammes() {
  const governedRecords = await getProgrammeRecords();
  return mergeProgrammes(programmes, getPublishedProgrammeRecords(governedRecords));
}

export function mergeProgrammes(seedProgrammes: Programme[], records: Programme[]) {
  const recordIds = new Set(records.map((record) => record.id));
  return [
    ...records,
    ...seedProgrammes.filter((programme) => !recordIds.has(programme.id)),
  ];
}
