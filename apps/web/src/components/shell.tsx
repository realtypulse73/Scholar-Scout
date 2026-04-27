'use client';

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { PropsWithChildren } from 'react';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/profile', label: 'Profile' },
  { href: '/programs', label: 'Programs' },
  { href: '/matches', label: 'Matches' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Shell({ children }: PropsWithChildren) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f7f4ea 0%, #ffffff 100%)', color: '#18230f' }}>
      <header style={{ borderBottom: '1px solid #d9dfc8', padding: '20px 32px' }}>
        <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <strong style={{ fontSize: 20 }}>ScholarScout</strong>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ color: '#355e3b', textDecoration: 'none' }}>
              {item.label}
            </Link>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <SignedOut>
              <SignInButton mode="modal">
                <button style={{ padding: '10px 16px', borderRadius: 999, border: '1px solid #355e3b', background: 'transparent', color: '#355e3b' }}>
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </nav>
      </header>
      <main style={{ padding: 32 }}>{children}</main>
    </div>
  );
}
