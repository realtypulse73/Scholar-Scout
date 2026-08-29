import 'server-only';

import type { OnboardingData } from '@/lib/onboarding-types';
import {
  createAuditEvent,
  PersistenceConflictError,
  readVersionedScholarScoutData,
  writeVersionedScholarScoutData,
  type StoredUser,
} from '@/lib/server/data-store';

export async function createStudentAccountRecord(
  user: StoredUser,
  options: { auditCreation?: boolean } = {},
): Promise<StoredUser> {
  const snapshot = await readVersionedScholarScoutData();

  if (snapshot.data.users.some((candidate) => candidate.email === user.email)) {
    throw new Error('Account already exists.');
  }

  snapshot.data.users.push(user);
  if (options.auditCreation) {
    snapshot.data.auditEvents.push(
      createAuditEvent(user.id, 'create', 'onboarding', user.id),
    );
  }

  const result = await writeVersionedScholarScoutData(
    snapshot.data,
    snapshot.version,
  );
  if (result.status === 'conflict') {
    throw new PersistenceConflictError();
  }

  return user;
}

export async function findOrCreateOAuthStudentRecord(
  user: StoredUser,
): Promise<StoredUser> {
  const snapshot = await readVersionedScholarScoutData();
  const existing = snapshot.data.users.find(
    (candidate) => candidate.email === user.email,
  );

  if (existing) {
    return existing;
  }

  snapshot.data.users.push(user);
  snapshot.data.auditEvents.push(
    createAuditEvent(user.id, 'create', 'onboarding', user.id),
  );
  const result = await writeVersionedScholarScoutData(
    snapshot.data,
    snapshot.version,
  );
  if (result.status === 'conflict') {
    throw new PersistenceConflictError();
  }

  return user;
}

export async function replaceStudentOnboardingProfile(
  studentKey: string,
  profile: OnboardingData,
): Promise<void> {
  const snapshot = await readVersionedScholarScoutData();
  snapshot.data.onboardingProfiles[studentKey] = profile;
  snapshot.data.auditEvents.push(
    createAuditEvent(studentKey, 'save', 'onboarding', studentKey),
  );

  const result = await writeVersionedScholarScoutData(
    snapshot.data,
    snapshot.version,
  );
  if (result.status === 'conflict') {
    throw new PersistenceConflictError();
  }
}
