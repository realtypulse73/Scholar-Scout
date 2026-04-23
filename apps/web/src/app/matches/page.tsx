'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import { getMatches, getStudentProfile, syncClerkUser, type MatchResponse } from '../../lib/api';

export default function MatchesPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [matchData, setMatchData] = useState<MatchResponse | null>(null);
  const [status, setStatus] = useState('Loading matches...');

  useEffect(() => {
    async function loadMatches() {
      if (!isLoaded || !isSignedIn || !user?.primaryEmailAddress?.emailAddress) {
        setStatus('Sign in to see your matches.');
        return;
      }

      const backendUser = await syncClerkUser({
        id: user.id,
        email: user.primaryEmailAddress.emailAddress,
      });
      const profile = await getStudentProfile(backendUser.id);

      if (!profile) {
        setStatus('Create your profile first to generate matches.');
        return;
      }

      const response = await getMatches(profile.id);
      setMatchData(response);
      setStatus(
        response.matches.length > 0
          ? `Loaded ${response.matches.length} matches.`
          : 'No matches yet. Add programs or broaden your interests.',
      );
    }

    loadMatches().catch(() => {
      setStatus('Unable to load matches right now.');
    });
  }, [isLoaded, isSignedIn, user]);

  return (
    <Shell>
      <section style={{ display: 'grid', gap: 20 }}>
        <h1>Match Results</h1>
        <p style={{ margin: 0, color: '#6b7b52' }}>{status}</p>
        {matchData?.matches.map((match) => (
          <article
            key={match.programId}
            style={{
              padding: 24,
              borderRadius: 18,
              border: '1px solid #d9dfc8',
              background: '#fff',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <h2 style={{ margin: 0 }}>{match.programName}</h2>
              <strong>{match.score}</strong>
            </div>
            <p style={{ marginBottom: 0 }}>{match.reasons.join(' | ')}</p>
          </article>
        ))}
      </section>
    </Shell>
  );
}
