import 'server-only';

import {
  readVersionedScholarScoutData,
  writeVersionedScholarScoutData,
  type ScholarScoutData,
} from '@/lib/server/data-store';

export type ConditionalMutationResult<T> =
  | { status: 'applied'; value: T }
  | { status: 'conflict' };

export async function commitConditionalMutation<T>(
  mutate: (data: ScholarScoutData) => T,
): Promise<ConditionalMutationResult<T>> {
  // A separate, harmless request can update the shared document between the
  // read and write. Re-evaluate on one fresh snapshot before surfacing a
  // conflict to the contributor workflow.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const snapshot = await readVersionedScholarScoutData();
    const value = mutate(snapshot.data);
    const result = await writeVersionedScholarScoutData(
      snapshot.data,
      snapshot.version,
    );
    if (result.status === 'applied') return { status: 'applied', value };
  }
  return { status: 'conflict' };
}
