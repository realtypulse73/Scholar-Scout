const cards = [
  ['Active schools', '24'],
  ['Program uploads', '8 pending'],
  ['Subscription MRR', '$12,400'],
  ['Applications tracked', '1,284'],
];

export default function AdminDashboardPage() {
  return (
    <main style={{ padding: 32, fontFamily: 'Georgia, serif' }}>
      <h1>School Analytics Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {cards.map(([label, value]) => (
          <section key={label} style={{ padding: 24, border: '1px solid #ddd', borderRadius: 16 }}>
            <p style={{ margin: 0 }}>{label}</p>
            <h2 style={{ marginBottom: 0 }}>{value}</h2>
          </section>
        ))}
      </div>
    </main>
  );
}

