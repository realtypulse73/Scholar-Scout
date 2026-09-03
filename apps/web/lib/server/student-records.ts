import 'server-only';

import type { OnboardingData } from '@/lib/onboarding-types';
import {
  createAuditEvent,
  PersistenceConflictError,
  readVersionedScholarScoutData,
  writeVersionedScholarScoutData,
  type StoredUser,
} from '@/lib/server/data-store';
import type { ShortlistPlanMap } from '@/lib/shortlist';

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

export async function replaceStudentShortlistState(
  studentKey: string,
  programmeIds: string[],
  plans: ShortlistPlanMap,
): Promise<void> {
  const snapshot = await readVersionedScholarScoutData();
  const normalizedIds = normalizeProgrammeIds(programmeIds);
  snapshot.data.shortlists[studentKey] = normalizedIds;
  snapshot.data.shortlistPlans = snapshot.data.shortlistPlans ?? {};
  snapshot.data.shortlistPlans[studentKey] = prunePlans(plans, normalizedIds);
  snapshot.data.auditEvents.push(
    createAuditEvent(studentKey, 'save', 'shortlist', studentKey),
  );

  await commitSnapshot(snapshot.data, snapshot.version);
}

export async function replaceStudentShortlistIds(
  studentKey: string,
  programmeIds: string[],
): Promise<void> {
  const snapshot = await readVersionedScholarScoutData();
  const normalizedIds = normalizeProgrammeIds(programmeIds);
  snapshot.data.shortlists[studentKey] = normalizedIds;
  snapshot.data.shortlistPlans = snapshot.data.shortlistPlans ?? {};
  snapshot.data.shortlistPlans[studentKey] = prunePlans(
    snapshot.data.shortlistPlans[studentKey] ?? {},
    normalizedIds,
  );
  snapshot.data.auditEvents.push(
    createAuditEvent(studentKey, 'save', 'shortlist', studentKey),
  );

  await commitSnapshot(snapshot.data, snapshot.version);
}

export async function replaceStudentShortlistPlans(
  studentKey: string,
  plans: ShortlistPlanMap,
): Promise<void> {
  const snapshot = await readVersionedScholarScoutData();
  snapshot.data.shortlistPlans = snapshot.data.shortlistPlans ?? {};
  snapshot.data.shortlistPlans[studentKey] = prunePlans(
    plans,
    snapshot.data.shortlists[studentKey] ?? [],
  );
  snapshot.data.auditEvents.push(
    createAuditEvent(studentKey, 'save-plans', 'shortlist', studentKey),
  );

  await commitSnapshot(snapshot.data, snapshot.version);
}

async function commitSnapshot(
  data: Parameters<typeof writeVersionedScholarScoutData>[0],
  version: string | null,
): Promise<void> {
  const result = await writeVersionedScholarScoutData(data, version);
  if (result.status === 'conflict') {
    throw new PersistenceConflictError();
  }
}

function normalizeProgrammeIds(programmeIds: string[]): string[] {
  return Array.from(new Set(programmeIds.filter(Boolean))).sort();
}

function prunePlans(
  plans: ShortlistPlanMap,
  programmeIds: string[],
): ShortlistPlanMap {
  const allowedIds = new Set(programmeIds);
  return Object.fromEntries(
    Object.entries(plans)
      .filter(([programmeId]) => allowedIds.has(programmeId))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([programmeId, plan]) => [
        programmeId,
        { status: plan.status, note: plan.note.trim() },
      ]),
  );
}
