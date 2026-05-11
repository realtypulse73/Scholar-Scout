'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Badge, Card } from '@/components/ui';

interface StaffGateProps {
  children: ReactNode;
}

export default function StaffGate({ children }: StaffGateProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return null;
  }

  if (session?.user?.role !== 'staff') {
    return (
      <Card className="p-8 text-center">
        <Badge tone="warning" className="mb-4">
          Staff access
        </Badge>
        <h1 className="text-2xl font-extrabold text-ink-900">
          Sign in as staff to use CMS tools
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-600">
          Staff tools now require an authenticated staff account. Production
          deployments should pair this with provider-based authorization policy.
        </p>
        <Link
          href="/auth/sign-in"
          className="mt-6 inline-flex min-h-touch items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  return <>{children}</>;
}
