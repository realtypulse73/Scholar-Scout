'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function AuthStatusLink() {
  const { data: session } = useSession();

  return (
    <Link
      href={session ? '/profile' : '/auth/sign-in'}
      className="text-sm font-semibold text-ink-600 hover:text-brand-700"
    >
      {session?.user?.name ?? 'Sign in'}
    </Link>
  );
}
