import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

export default function TicketPage() {
  const { ticketId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    async function loadTicket() {
      setLoading(true)
      setError('')

      try {
        const res = await fetch(`/api/tickets/${ticketId}`)
        const payload = await res.json()

        if (!res.ok) throw new Error(payload.message || 'Failed to load ticket')

        setTicket(payload.data?.ticket)
        setEvent(payload.data?.event)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadTicket()
  }, [ticketId])

  useEffect(() => {
    const reference = searchParams.get('reference')
    if (!ticket || !reference || ticket.status === 'confirmed') return

    async function verifyPayment() {
      setVerifying(true)

      try {
        const res = await fetch('/api/tickets/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, reference }),
        })
        const payload = await res.json()

        if (!res.ok) throw new Error(payload.message || 'Payment verification failed')

        setTicket(payload.data?.ticket)
        setEvent(payload.data?.event)
        navigate(
          `/thank-you?type=ticket&back=${encodeURIComponent(`/public/events/${payload.data?.ticket?.eventId}`)}&title=${encodeURIComponent('Thank you for your payment')}&subtitle=${encodeURIComponent('Your ticket is confirmed. You can reserve another one for a friend next.')}`,
          { replace: true }
        )
      } catch (err) {
        setError(err.message)
      } finally {
        setVerifying(false)
      }
    }

    verifyPayment()
  }, [navigate, ticket, ticketId, searchParams])

  if (loading) return <Shell message="Loading ticket..." />
  if (error && !ticket) return <Shell message={error} actionLabel="Back to Events" onAction={() => navigate('/events')} />
  if (!ticket) return <Shell message="Ticket not found" actionLabel="Back to Events" onAction={() => navigate('/events')} />

  const ticketUrl = `${window.location.origin}/tickets/${ticket.ticketId}`

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        <section style={styles.card}>
          <div style={styles.kicker}>Your Ticket</div>
          <h1 style={styles.title}>{event?.title || 'Event Ticket'}</h1>
          <p style={styles.subTitle}>{event?.startDate} · {event?.startTime}{event?.location ? ` · ${event.location}` : ''}</p>

          <div style={styles.bodyGrid}>
            <div style={styles.qrPanel}>
              <QRCodeSVG value={ticketUrl} size={220} bgColor="#ffffff" fgColor="#0b0b10" includeMargin />
              <div style={styles.ticketId}>{ticket.ticketId}</div>
            </div>

            <div style={styles.metaPanel}>
              {searchParams.get('success') === '1' && <div style={styles.success}>Your QR code has been successfully sent to your Gmail.</div>}
              {verifying && <div style={styles.success}>Verifying payment with Paystack...</div>}
              {ticket.status === 'confirmed' && <div style={styles.success}>Payment confirmed. Your QR ticket is ready.</div>}
              <div style={styles.metaRow}><span>Name</span><strong>{ticket.attendeeName}</strong></div>
              <div style={styles.metaRow}><span>Email</span><strong>{ticket.attendeeEmail}</strong></div>
              <div style={styles.metaRow}><span>Type</span><strong>{ticket.ticketType}</strong></div>
              <div style={styles.metaRow}><span>Status</span><strong>{ticket.status}</strong></div>
              <div style={styles.metaRow}><span>Price</span><strong>{ticket.price ? `₦${Number(ticket.price).toLocaleString()}` : 'Free'}</strong></div>
              <button type="button" style={styles.primaryBtn} onClick={() => navigate(`/public/events/${ticket.eventId}`)}>
                Back to Event
              </button>
              {searchParams.get('success') === '1' && <div style={styles.success}>Ticket confirmed. Check your email for a copy.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function Shell({ message, actionLabel, onAction }) {
  return (
    <div style={styles.shell}>
      <div style={styles.shellCard}>
        <div style={styles.shellTitle}>{message}</div>
        {onAction && (
          <button type="button" style={styles.primaryBtn} onClick={onAction}>
            {actionLabel || 'Continue'}
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(180deg, #101014 0%, #0b0b10 100%)', color: '#f1f1f5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  shell: { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#101014', color: '#f1f1f5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  shellCard: { padding: 24, borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' },
  shellTitle: { fontSize: 18, marginBottom: 12 },
  main: { maxWidth: 920, margin: '0 auto', padding: '48px 28px' },
  card: { padding: 22, borderRadius: 24, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' },
  kicker: { color: '#a9a9b6', fontWeight: 700, marginBottom: 8 },
  title: { fontSize: 'clamp(38px, 6vw, 60px)', lineHeight: 1, margin: 0, fontWeight: 900, letterSpacing: '-0.05em' },
  subTitle: { color: '#cfd0da', marginTop: 12, marginBottom: 24 },
  bodyGrid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: 18, alignItems: 'start' },
  qrPanel: { display: 'grid', placeItems: 'center', padding: 18, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' },
  ticketId: { marginTop: 14, fontFamily: 'monospace', fontSize: 13, color: '#a9a9b6', wordBreak: 'break-all', textAlign: 'center' },
  metaPanel: { padding: 10 },
  metaRow: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#d4d4de' },
  primaryBtn: { marginTop: 16, border: 'none', borderRadius: 14, padding: '12px 16px', background: '#f1f1f5', color: '#111', fontWeight: 800, cursor: 'pointer' },
  success: { marginTop: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(34,197,94,0.12)', color: '#86efac', fontWeight: 700 },
}