'use client';

import { useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import { getPrograms } from '../../lib/api';

type Program = Awaited<ReturnType<typeof getPrograms>>[number];

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [status, setStatus] = useState('Loading programs...');

  useEffect(() => {
    async function loadPrograms() {
      const nextPrograms = await getPrograms();
      setPrograms(nextPrograms);
      setStatus(
        nextPrograms.length > 0
          ? `Loaded ${nextPrograms.length} programs from the API.`
          : 'No programs are available yet.',
      );
    }

    loadPrograms().catch(() => {
      setStatus('Unable to load programs right now.');
    });
  }, []);

  return (
    <Shell>
      <section style={{ display: 'grid', gap: 20 }}>
        <h1>Programs</h1>
        <p style={{ margin: 0, color: '#6b7b52' }}>{status}</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {programs.map((program) => (
            <article
              key={program.id}
              style={{
                padding: 24,
                borderRadius: 18,
                border: '1px solid #d9dfc8',
                background: '#fff',
                display: 'grid',
                gap: 12,
              }}
            >
              <div>
                <p style={{ margin: 0, color: '#6b7b52' }}>{program.school}</p>
                <h2 style={{ margin: '8px 0 0 0' }}>{program.name}</h2>
              </div>
              <p style={{ margin: 0 }}>
                <strong>Field:</strong> {program.field}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Location:</strong> {program.location}
              </p>
              <p style={{ margin: 0 }}>
                <strong>GPA range:</strong> {program.minGpa.toFixed(1)} -{' '}
                {program.maxGpa.toFixed(1)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}
