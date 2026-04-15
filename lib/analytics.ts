export async function trackEvent(
  name,
  programId,
  metadata
) {
  if (typeof window === 'undefined') return

  const event = {
    id: `${name}-${Date.now()}`,
    name,
    programId,
    metadata,
    createdAt: new Date().toISOString()
  }

  try {
    navigator.sendBeacon?.('/api/analytics', JSON.stringify(event))

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true
    })
  } catch {
    // fallback silently
  }
}
