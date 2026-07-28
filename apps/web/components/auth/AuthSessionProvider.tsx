'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <GuestMigrationTrigger>{children}</GuestMigrationTrigger>
    </SessionProvider>
  );
}

function GuestMigrationTrigger({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const requestedAccountIds = useRef(new Set<string>());
  const [completedAccountId, setCompletedAccountId] = useState<string | null>(null);
  const [migrationError, setMigrationError] = useState(false);
  const accountId = session?.user?.id;

  useEffect(() => {
    if (status !== 'authenticated' || !accountId || requestedAccountIds.current.has(accountId)) {
      return;
    }

    requestedAccountIds.current.add(accountId);
    setMigrationError(false);

    void fetch('/api/account/guest-migration', { method: 'POST' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Guest migration failed.');
        }

        setCompletedAccountId(accountId);
      })
      .catch(() => {
        setMigrationError(true);
        setCompletedAccountId(accountId);
      });
  }, [accountId, status]);

  const waitingForMigration =
    status === 'authenticated' &&
    Boolean(accountId) &&
    completedAccountId !== accountId;

  if (waitingForMigration) {
    return <p className="sr-only">Preparing your account.</p>;
  }

  return (
    <>
      {migrationError ? (
        <p role="alert" className="px-4 py-2 text-center text-sm font-semibold text-danger-700">
          We could not transfer your guest activity. Please try again.
        </p>
      ) : null}
      {children}
    </>
  );
}
