import { NextResponse } from 'next/server';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import { validateAll } from '@/lib/onboarding-validation';
import {
  getOnboardingProfile,
  PersistenceConflictError,
  saveOnboardingProfile,
} from '@/lib/server/data-store';
import { resolveStudentActor } from '@/lib/server/student-actor';
import type { OnboardingData } from '@/lib/onboarding-types';

const MAX_ONBOARDING_REQUEST_BYTES = 4 * 1024;
const GPA_BANDS = new Set([
  'below-2.0',
  '2.0-2.4',
  '2.5-2.9',
  '3.0-3.4',
  '3.5-4.0',
  'no-gpa',
]);
const INTERESTS = new Set([
  'stem',
  'arts',
  'business',
  'education',
  'healthcare',
  'trades',
  'social-sciences',
  'law',
  'sports',
  'technology',
  'environment',
  'undecided',
]);
const LOCATION_PREFERENCES = new Set([
  'local',
  'in-state',
  'out-of-state',
  'international',
  'online-only',
  'no-preference',
]);
const PATHWAY_PREFERENCES = new Set([
  '4-year-university',
  '2-year-community-college',
  'trade-vocational',
  'certificate-program',
  'apprenticeship',
  'online-degree',
  'undecided',
]);
const SUPPORT_NEEDS = new Set([
  'financial-aid',
  'first-gen',
  'disability-services',
  'mental-health',
  'tutoring',
  'career-counseling',
  'housing',
  'childcare',
  'language-support',
  'none',
]);

export async function GET() {
  const actor = await resolveActor();

  if (actor instanceof NextResponse) {
    return actor;
  }

  return NextResponse.json({
    profile: await getOnboardingProfile(actor.storageKey),
  });
}

export async function POST(request: Request) {
  const actor = await resolveActor();

  if (actor instanceof NextResponse) {
    return actor;
  }

  const body = await parseJsonRequest(request, {
    maxBytes: MAX_ONBOARDING_REQUEST_BYTES,
    validate: validateOnboardingProfile,
  });

  if (!body.ok) {
    return NextResponse.json(
      { error: 'Invalid onboarding profile.' },
      { status: body.error === 'body-too-large' ? 413 : 400 },
    );
  }

  try {
    await saveOnboardingProfile(actor.storageKey, body.value);
  } catch (error) {
    if (error instanceof PersistenceConflictError) {
      return studentConflictResponse();
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}

function studentConflictResponse() {
  return NextResponse.json(
    {
      error: 'Student data changed. Reload and try again.',
      category: 'conflict',
      action: 'reload',
    },
    { status: 409 },
  );
}

async function resolveActor() {
  try {
    const actor = await resolveStudentActor({ allowGuest: true });

    return actor ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch {
    return NextResponse.json(
      { error: 'Student identity is not available right now.' },
      { status: 503 },
    );
  }
}

function validateOnboardingProfile(value: unknown): OnboardingData | null {
  if (
    !isExactObject(value, [
      'gpaBand',
      'interests',
      'locationPreference',
      'pathwayPreference',
      'affordabilitySensitivity',
      'supportNeeds',
    ])
  ) {
    return null;
  }

  const gpaBand = readEnum(value.gpaBand, GPA_BANDS);
  const interests = readEnumList(value.interests, INTERESTS, INTERESTS.size);
  const locationPreference = readEnum(value.locationPreference, LOCATION_PREFERENCES);
  const pathwayPreference = readEnum(value.pathwayPreference, PATHWAY_PREFERENCES);
  const supportNeeds = readEnumList(value.supportNeeds, SUPPORT_NEEDS, SUPPORT_NEEDS.size);
  const affordabilitySensitivity = value.affordabilitySensitivity;

  if (
    !gpaBand ||
    !locationPreference ||
    !pathwayPreference ||
    typeof affordabilitySensitivity !== 'number' ||
    !Number.isSafeInteger(affordabilitySensitivity) ||
    affordabilitySensitivity < 1 ||
    affordabilitySensitivity > 5 ||
    supportNeeds.includes('none') && supportNeeds.length > 1
  ) {
    return null;
  }

  const profile = {
    gpaBand,
    interests,
    locationPreference,
    pathwayPreference,
    affordabilitySensitivity,
    supportNeeds,
  } as OnboardingData;

  if (validateAll(profile).length > 0) {
    return null;
  }

  return profile;
}

function readEnum<T extends string>(value: unknown, values: Set<T>): T | null {
  return typeof value === 'string' && values.has(value as T) ? (value as T) : null;
}

function readEnumList<T extends string>(
  value: unknown,
  values: Set<T>,
  maxLength: number,
): T[] {
  if (!Array.isArray(value) || value.length > maxLength) {
    return [];
  }

  const items = value.map((item) => readEnum(item, values));

  return items.some((item) => item === null) || new Set(items).size !== items.length
    ? []
    : (items as T[]);
}
