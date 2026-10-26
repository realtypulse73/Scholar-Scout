'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { classNames } from '@/lib/class-names';

type JourneyTheme = 'rural' | 'city' | 'workplace' | 'next-step' | 'reentry';

const QUIET_PREFIXES = ['/admin', '/contribute/media', '/phase-5-accessibility-uat'];

function getJourneyTheme(pathname: string): JourneyTheme {
  if (pathname.startsWith('/onboarding') || pathname === '/') {
    return 'rural';
  }

  if (pathname.startsWith('/advisor') || pathname.startsWith('/simulate')) {
    return 'workplace';
  }

  if (pathname.startsWith('/stories')) {
    return 'reentry';
  }

  if (pathname.startsWith('/peer-community') || pathname.startsWith('/profile')) {
    return 'next-step';
  }

  if (pathname.startsWith('/auth')) {
    return 'next-step';
  }

  return 'city';
}

export default function LearnerVisualShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '/';
  const isQuiet = QUIET_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const theme = getJourneyTheme(pathname);

  if (isQuiet) {
    return <>{children}</>;
  }

  return (
    <div className="relative isolate min-h-screen" data-journey-theme={theme}>
      <div
        aria-hidden="true"
        className={classNames(
          'journey-backdrop journey-backdrop--fixed',
          `journey-backdrop--${theme}`,
          pathname.startsWith('/auth') && 'journey-backdrop--quiet',
        )}
      >
        <span className="journey-backdrop__motion" />
      </div>
      <div className="journey-page-content relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}
