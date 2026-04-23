import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Shell } from '../components/shell';

export default function HomePage() {
  return (
    <Shell>
      <section style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: 2, color: '#6b7b52' }}>
          Phase 1 MVP
        </p>
        <h1 style={{ fontSize: 56, margin: 0 }}>Match students to the right programs faster.</h1>
        <p style={{ fontSize: 18, lineHeight: 1.6 }}>
          ScholarScout combines academic profile data, program fit, and location preferences
          to help students discover opportunities and help schools understand demand.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button style={{ width: 220, padding: 14, borderRadius: 999, border: 0, background: '#355e3b', color: '#fff', fontSize: 16 }}>
              Get started
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <p style={{ color: '#355e3b', fontWeight: 700 }}>You are signed in and ready to build your profile.</p>
        </SignedIn>
      </section>
    </Shell>
  );
}
