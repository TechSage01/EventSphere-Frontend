import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../services/api.js'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [details, setDetails] = useState(null)

  const reference = searchParams.get('reference') || ''
  const queryType = String(searchParams.get('type') || '').toLowerCase()

  useEffect(() => {
    let active = true
    async function verifyPayment() {
      if (!reference) {
        setError('Missing payment reference.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const payload = await apiRequest('/payments/paystack/verify', {
          method: 'POST',
          body: JSON.stringify({ reference }),
        })
        if (!active) return
        setDetails(payload.data || null)
      } catch (err) {
        if (!active) return
        setError(err.message || 'Unable to verify payment')
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    verifyPayment()
    return () => {
      active = false
    }
  }, [reference])

  const resolvedType = String(details?.type || queryType || 'ticket').toLowerCase()
  const isVote = resolvedType === 'vote'
  const eventId = details?.eventId || searchParams.get('eventId') || ''
  const ticketId = details?.ticket?.ticketId || searchParams.get('ticketId') || ''

  const primaryAction = useMemo(() => {
    if (isVote && eventId) {
      return { label: 'Back to Event', path: `/public/events/${eventId}` }
    }
    if (!isVote && ticketId) {
      return { label: 'View Ticket', path: `/tickets/${ticketId}` }
    }
    return { label: 'Back to Home', path: '/' }
  }, [eventId, isVote, ticketId])

  const voteSummary = {
    nomineeName: details?.contestant?.name || 'Nominee',
    quantity: Number(details?.quantity || 0),
    paymentReference: details?.paymentReference || reference,
  }

  const ticketSummary = {
    eventTitle: details?.event?.title || 'Your event',
    ticketId: details?.ticket?.ticketId || ticketId,
    paymentReference: details?.paymentReference || reference,
  }

  return (
    <div style={styles.page}>
      <main style={styles.card}>
        <div style={styles.iconWrap} aria-hidden="true">
          <span style={styles.icon}>✓</span>
        </div>

        {loading && (
          <>
            <h1 style={styles.title}>Verifying Payment</h1>
            <p style={styles.subtitle}>Confirming your transaction with Paystack...</p>
          </>
        )}

        {!loading && error && (
          <>
            <h1 style={styles.title}>Payment Pending</h1>
            <p style={styles.subtitle}>{error}</p>
          </>
        )}

        {!loading && !error && isVote && (
          <>
            <h1 style={styles.title}>Vote Successful</h1>
            <p style={styles.subtitle}>Your votes have been securely updated on the platform.</p>
            <div style={styles.detailGrid}>
              <div style={styles.detailRow}><span>Nominee</span><strong>{voteSummary.nomineeName}</strong></div>
              <div style={styles.detailRow}><span>Votes purchased</span><strong>{voteSummary.quantity}</strong></div>
              <div style={styles.detailRow}><span>Payment reference</span><strong>{voteSummary.paymentReference}</strong></div>
            </div>
          </>
        )}

        {!loading && !error && !isVote && (
          <>
            <h1 style={styles.title}>Payment Successful</h1>
            <p style={styles.subtitle}>Your ticket has been confirmed. Check your email for your QR code.</p>
            <div style={styles.detailGrid}>
              <div style={styles.detailRow}><span>Event</span><strong>{ticketSummary.eventTitle}</strong></div>
              <div style={styles.detailRow}><span>Ticket ID</span><strong>{ticketSummary.ticketId}</strong></div>
              <div style={styles.detailRow}><span>Payment reference</span><strong>{ticketSummary.paymentReference}</strong></div>
            </div>
          </>
        )}

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
  detailGrid: {
    display: 'grid',
    gap: 10,
    marginTop: 12,
    marginBottom: 24,
    textAlign: 'left',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    padding: '10px 12px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    fontSize: 14,
  },
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
