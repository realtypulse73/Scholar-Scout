import {
  canAccessStaffTools,
  createLocalSession,
  parseLocalSession,
  serializeLocalSession,
} from '@/lib/local-auth';

describe('local auth helpers', () => {
  it('creates normalized local sessions', () => {
    const session = createLocalSession({
      email: ' USER@Example.COM ',
      name: '',
      role: 'student',
    });

    expect(session.email).toBe('user@example.com');
    expect(session.name).toBe('user');
    expect(session.role).toBe('student');
  });

  it('serializes and parses valid sessions', () => {
    const session = createLocalSession({
      email: 'staff@example.com',
      name: 'Staff User',
      role: 'staff',
    });

    expect(parseLocalSession(serializeLocalSession(session))).toEqual(session);
  });

  it('rejects invalid session values', () => {
    expect(parseLocalSession('{bad')).toBeNull();
    expect(parseLocalSession('{"role":"staff"}')).toBeNull();
  });

  it('allows staff tools only for staff sessions', () => {
    expect(
      canAccessStaffTools(
        createLocalSession({
          email: 'staff@example.com',
          role: 'staff',
        }),
      ),
    ).toBe(true);
    expect(
      canAccessStaffTools(
        createLocalSession({
          email: 'student@example.com',
          role: 'student',
        }),
      ),
    ).toBe(false);
  });
});
