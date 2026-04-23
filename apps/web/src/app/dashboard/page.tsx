'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import {
  getMatches,
  getNotifications,
  getPrograms,
  getStudentProfile,
  syncClerkUser,
} from '../../lib/api';

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [cards, setCards] = useState<Array<[string, string]>>([
    ['Profile status', 'Loading'],
    ['Programs matched', '0'],
    ['Inbox messages', '0'],
    ['Programs available', '0'],
  ]);

  useEffect(() => {
    async function loadDashboard() {
      if (!isLoaded || !isSignedIn || !user?.primaryEmailAddress?.emailAddress) {
        setCards([
          ['Profile status', 'Sign in'],
          ['Programs matched', '0'],
          ['Inbox messages', '0'],
          ['Programs available', '0'],
        ]);
        return;
      }

      const backendUser = await syncClerkUser({
        id: user.id,
        email: user.primaryEmailAddress.emailAddress,
      });
      const [profile, notifications, programs] = await Promise.all([
        getStudentProfile(backendUser.id),
        getNotifications(backendUser.id),
        getPrograms(),
      ]);

      const matches = profile ? await getMatches(profile.id, 5) : null;

      setCards([
        ['Profile status', profile ? 'Complete' : 'Needs setup'],
        ['Programs matched', `${matches?.matches.length ?? 0}`],
        ['Inbox messages', `${notifications.length}`],
        ['Programs available', `${programs.length}`],
      ]);
    }

    loadDashboard().catch(() => {
      setCards([
        ['Profile status', 'Error'],
        ['Programs matched', 'Error'],
        ['Inbox messages', 'Error'],
        ['Programs available', 'Error'],
      ]);
    });
  }, [isLoaded, isSignedIn, user]);

  return (
    <Shell>
      <section style={{ display: 'grid', gap: 24 }}>
        <h1>Student Dashboard</h1>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {cards.map(([label, value]) => (
            <div
              key={label}
              style={{
                background: '#fff',
                border: '1px solid #d9dfc8',
                borderRadius: 18,
                padding: 24,
              }}
            >
              <p style={{ margin: 0, color: '#6b7b52' }}>{label}</p>
              <h2 style={{ marginBottom: 0 }}>{value}</h2>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
