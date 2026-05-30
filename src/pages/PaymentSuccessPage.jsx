import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const messageMap = {
  vote: 'Thank you! Your votes have been successfully cast and recorded.',
  ticket: 'Success! Your ticket has been purchased. Check your email for your QR code.',
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const type = (searchParams.get('type') || 'ticket').toLowerCase()
  const eventId = searchParams.get('eventId') || ''

  const message = messageMap[type] || messageMap.ticket
  const primaryAction = useMemo(() => {
    if (eventId) {
      return { label: 'Back to Event', path: `/public/events/${eventId}` }
    }

    return { label: 'Back to Home', path: '/' }
  }, [eventId])

  return (
    <div style={styles.page}>
      <main style={styles.card}>
        <div style={styles.iconWrap} aria-hidden="true">
          <span style={styles.icon}>✓</span>
        </div>
        <h1 style={styles.title}>Payment Successful</h1>
        <p style={styles.subtitle}>{message}</p>
        <button type="button" style={styles.primaryBtn} onClick={() => navigate(primaryAction.path)}>
          {primaryAction.label}
        </button>
      </main>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    background: 'radial-gradient(circle at top, rgba(34,197,94,0.16), transparent 35%), linear-gradient(180deg, #0f1015 0%, #0b0c10 100%)',
    color: '#f8fafc',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  card: {
    width: 'min(100%, 560px)',
    padding: '36px 28px',
    borderRadius: 28,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
    textAlign: 'center',
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    margin: '0 auto 18px',
    background: 'rgba(34,197,94,0.16)',
    border: '1px solid rgba(34,197,94,0.35)',
  },
  icon: { fontSize: 34, fontWeight: 900, color: '#4ade80' },
  title: { margin: 0, fontSize: 'clamp(26px, 4vw, 40px)' },
  subtitle: { margin: '12px 0 24px', color: '#cbd5f5', lineHeight: 1.6, fontSize: 15 },
  primaryBtn: {
    border: 'none',
    borderRadius: 14,
    padding: '12px 20px',
    background: '#22c55e',
    color: '#0b0c0f',
    fontWeight: 800,
    cursor: 'pointer',
    minWidth: 200,
  },
}
