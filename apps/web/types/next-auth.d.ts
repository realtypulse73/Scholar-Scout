import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'student' | 'staff';
    } & DefaultSession['user'];
  }

  interface User {
    role: 'student' | 'staff';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'student' | 'staff';
  }
}
