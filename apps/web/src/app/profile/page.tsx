'use client';

import { useUser } from '@clerk/nextjs';
import { FormEvent, useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import {
  getStudentProfile,
  syncClerkUser,
  upsertStudentProfile,
} from '../../lib/api';

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [form, setForm] = useState({
    gpa: '',
    interests: '',
    location: '',
  });
  const [status, setStatus] = useState('Loading profile...');

  useEffect(() => {
    async function loadProfile() {
      if (!isLoaded || !isSignedIn || !user?.primaryEmailAddress?.emailAddress) {
        setStatus('Sign in to create your student profile.');
        return;
      }

      const backendUser = await syncClerkUser({
        id: user.id,
        email: user.primaryEmailAddress.emailAddress,
      });
      const profile = await getStudentProfile(backendUser.id);

      if (profile) {
        setForm({
          gpa: profile.gpa.toString(),
          interests: profile.interests.join(', '),
          location: profile.location,
        });
        setStatus('Profile synced with the API.');
        return;
      }

      setStatus('Fill in your profile to start matching.');
    }

    loadProfile().catch(() => {
      setStatus('Unable to load your profile right now.');
    });
  }, [isLoaded, isSignedIn, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user?.primaryEmailAddress?.emailAddress) {
      setStatus('Sign in before saving your profile.');
      return;
    }

    setStatus('Saving profile...');
    try {
      await syncClerkUser({
        id: user.id,
        email: user.primaryEmailAddress.emailAddress,
      });
      await upsertStudentProfile({
        userId: user.id,
        gpa: Number(form.gpa),
        interests: form.interests
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        location: form.location,
      });
      setStatus('Profile saved.');
    } catch {
      setStatus('Profile save failed.');
    }
  }

  return (
    <Shell>
      <section style={{ display: 'grid', gap: 24, maxWidth: 720 }}>
        <h1>Student Profile</h1>
        <p style={{ margin: 0, color: '#6b7b52' }}>{status}</p>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: 16,
            padding: 24,
            background: '#ffffff',
            border: '1px solid #d9dfc8',
            borderRadius: 16,
          }}
        >
          <label>
            GPA
            <input
              value={form.gpa}
              onChange={(event) =>
                setForm((current) => ({ ...current, gpa: event.target.value }))
              }
              style={{ display: 'block', width: '100%', marginTop: 8, padding: 12 }}
              placeholder="3.8"
            />
          </label>
          <label>
            Interests
            <input
              value={form.interests}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  interests: event.target.value,
                }))
              }
              style={{ display: 'block', width: '100%', marginTop: 8, padding: 12 }}
              placeholder="Engineering, Computer Science, Research"
            />
          </label>
          <label>
            Preferred location
            <input
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              style={{ display: 'block', width: '100%', marginTop: 8, padding: 12 }}
              placeholder="New York"
            />
          </label>
          <button
            type="submit"
            style={{
              width: 180,
              padding: 12,
              borderRadius: 999,
              border: 0,
              background: '#355e3b',
              color: '#fff',
            }}
          >
            Save profile
          </button>
        </form>
      </section>
    </Shell>
  );
}
