export const LOCAL_SESSION_STORAGE_KEY = 'scholarscout.session';

export type LocalRole = 'student' | 'staff';

export interface LocalSession {
  email: string;
  name: string;
  role: LocalRole;
  createdAt: string;
}

export function createLocalSession({
  email,
  name,
  role,
}: {
  email: string;
  name?: string;
  role: LocalRole;
}): LocalSession {
  const normalizedEmail = email.trim().toLowerCase();
  const fallbackName = normalizedEmail.split('@')[0] || 'ScholarScout user';

  return {
    email: normalizedEmail,
    name: name?.trim() || fallbackName,
    role,
    createdAt: new Date().toISOString(),
  };
}

export function parseLocalSession(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return isLocalSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function serializeLocalSession(session: LocalSession) {
  return JSON.stringify(session);
}

export function canAccessStaffTools(session: LocalSession | null) {
  return session?.role === 'staff';
}

function isLocalSession(value: unknown): value is LocalSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<LocalSession>;

  return Boolean(
    session.email &&
      session.name &&
      session.createdAt &&
      (session.role === 'student' || session.role === 'staff'),
  );
}
