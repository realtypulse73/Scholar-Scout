import 'server-only';

import { getPublishedProgrammeRecords } from '@/lib/admin-programmes';
import { programmes, type Programme } from '@/lib/programmes';
import { getProgrammeRecords } from '@/lib/server/data-store';

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
