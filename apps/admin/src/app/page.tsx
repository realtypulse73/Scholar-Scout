import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <main style={{ padding: 32, fontFamily: 'Georgia, serif' }}>
      <h1>ScholarScout Admin</h1>
      <p>School account operations, uploads, and analytics live here.</p>
      <Link href="/dashboard">Open dashboard</Link>
    </main>
  );
}

