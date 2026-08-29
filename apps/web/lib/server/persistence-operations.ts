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
  const snapshot = await readVersionedScholarScoutData();
  const value = mutate(snapshot.data);
  const result = await writeVersionedScholarScoutData(
    snapshot.data,
    snapshot.version,
  );
  return result.status === 'applied'
    ? { status: 'applied', value }
    : { status: 'conflict' };
}
