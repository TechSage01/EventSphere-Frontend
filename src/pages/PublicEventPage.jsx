import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const themeMap = {
  minimal: { bg: ['#10262b', '#081722'], accent: '#5eead4' },
  aurora: { bg: ['#1a0533', '#0d1f3c'], accent: '#a78bfa' },
  sunrise: { bg: ['#2d1a0e', '#1f0d1a'], accent: '#fb923c' },
  ocean: { bg: ['#0a1628', '#061a2e'], accent: '#38bdf8' },
  forest: { bg: ['#0d2110', '#0a1a0d'], accent: '#4ade80' },
  rose: { bg: ['#2d0a1a', '#1a0a1a'], accent: '#fb7185' },
}

const ticketOptions = [
  { id: 'regular', label: 'Regular', desc: 'Standard entry for the event.' },
  { id: 'vip', label: 'VIP', desc: 'Priority entry and premium seating.' },
  { id: 'table', label: 'Table Reservation', desc: 'Reserve a table for your group.' },
]

export default function PublicEventPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedTicketType, setSelectedTicketType] = useState('regular')
  const [form, setForm] = useState({ name: '', email: '', note: '' })

  useEffect(() => {
    if (!form.email) return

    const derivedName = deriveNameFromEmail(form.email)
    setForm(prev => {
      if (prev.name && prev.name !== deriveNameFromEmail(prev.email)) return prev
      return { ...prev, name: derivedName }
    })
  }, [form.email])

  useEffect(() => {
    if (window.PaystackPop) return

    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    async function loadEvent() {
      setLoading(true)
      setError('')

      try {
        const res = await fetch(`/api/events/public/${eventId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to load event')
        setEvent(data.event)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [eventId])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setSuccess('')
    setError('')

    try {
      const res = await fetch(`/api/tickets/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ticketType: selectedTicketType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to reserve ticket')

      if (!data.paymentRequired) {
        setSuccess('Your ticket has been created.')
        navigate(`/tickets/${data.ticket.ticketId}?success=1`)
        return
      }

      if (!paystackPublicKey) {
        throw new Error('Paystack public key is missing')
      }

      if (!window.PaystackPop) {
        throw new Error('Paystack checkout is still loading. Please try again.')
      }

      const handler = window.PaystackPop.setup({
        key: paystackPublicKey,
        email: form.email,
        amount: data.amount,
        currency: 'NGN',
        ref: data.ticket.ticketId,
        metadata: {
          ticketId: data.ticket.ticketId,
          eventId,
          attendeeName: form.name,
          ticketType: selectedTicketType,
        },
        callback: response => {
          navigate(`/tickets/${data.ticket.ticketId}?reference=${encodeURIComponent(response.reference || data.ticket.ticketId)}&success=1`)
        },
        onClose: () => setError('Paystack checkout was closed before payment completed'),
      })

      handler.openIframe()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Shell message="Loading event..." />
  if (error && !event) return <Shell message={error} actionLabel="Back to Events" onAction={() => navigate('/events')} />
  if (!event) return <Shell message="Event not found" actionLabel="Back to Events" onAction={() => navigate('/events')} />

  const theme = themeMap[event.theme] || themeMap.minimal

  return (
    <div style={{ ...styles.page, background: `linear-gradient(180deg, ${theme.bg[0]} 0%, #101014 42%, #0b0b10 100%)` }}>
      <header style={styles.topbar}>
        <div style={styles.brandRow}>
          <span style={styles.logo}>✦</span>
          <span style={styles.brand}>EventSphere</span>
        </div>
        <button type="button" style={styles.backBtn} onClick={() => navigate(`/events/${event.id}`)}>
          Back to Overview
        </button>
      </header>

      <main style={styles.main}>
        <section style={styles.hero}>
          <div style={styles.heroMedia}>
            {event.coverImage ? <img src={event.coverImage} alt={event.title} style={styles.coverImage} /> : <div style={{ ...styles.coverFallback, background: `linear-gradient(135deg, ${theme.accent}33, rgba(255,255,255,0.02))` }} />}
          </div>
          <div style={styles.heroContent}>
            <div style={styles.eventKicker}>{event.isPublic ? 'Public Event' : 'Private Event'}</div>
            <h1 style={styles.title}>{event.title}</h1>
            <p style={styles.description}>{event.description || 'No description provided yet.'}</p>
            <div style={styles.metaRow}>
              <span style={styles.metaChip}>{formatDateLong(event.startDate)}</span>
              <span style={styles.metaChip}>{formatTimeRange(event.startTime, event.endTime)} GMT+1</span>
              <span style={styles.metaChip}>{event.location || 'Location to be announced'}</span>
              <span style={styles.metaChip}>{event.invitationsSent ? `${event.invitationsSent} invites sent` : 'No invitations yet'}</span>
            </div>
            <div style={styles.hostRow}>
              <div style={styles.hostAvatar}>{initials(event.hostName || 'Creator')}</div>
              <div>
                <div style={styles.hostName}>{event.hostName || 'Creator'}</div>
                <div style={styles.hostEmail}>{event.hostEmail || ''}</div>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.contentGrid}>
          <div style={styles.panel}>
            <div style={styles.panelHead}>Ticket Options</div>
            <div style={styles.ticketGrid}>
              {ticketOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  style={{ ...styles.ticketCard, ...(selectedTicketType === option.id ? styles.ticketCardActive : {}) }}
                  onClick={() => setSelectedTicketType(option.id)}
                >
                  <div style={styles.ticketCardTitle}>{option.label}</div>
                  <div style={styles.ticketCardDesc}>{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHead}>Reserve Your Spot</div>
            {success && <div style={styles.successBanner}>{success}</div>}
            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.field}>
                <span style={styles.label}>Name</span>
                <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} style={styles.input} placeholder="Auto-filled from email" />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Email</span>
                <input type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} style={styles.input} required />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Note</span>
                <textarea value={form.note} onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))} rows={4} style={styles.textarea} placeholder="Optional note for the host" />
              </label>
              <button type="submit" style={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Submitting…' : isFreePrice(event.ticketPrice) ? 'Reserve Ticket' : 'Continue to Payment'}
              </button>
            </form>
          </div>

          <div style={styles.panelWide}>
            <div style={styles.panelHead}>Event Details</div>
            <div style={styles.detailRow}><span>Visibility</span><strong>{event.isPublic ? 'Public' : 'Private'}</strong></div>
            <div style={styles.detailRow}><span>Host</span><strong>{event.hostName || 'Creator'}</strong></div>
            <div style={styles.detailRow}><span>Host Email</span><strong>{event.hostEmail || '-'}</strong></div>
            <div style={styles.detailRow}><span>Invitations</span><strong>{event.invitationsSent || 0}</strong></div>
            <div style={styles.detailRow}><span>RSVPs</span><strong>{event.rsvpCount || 0}</strong></div>
            <div style={styles.footerNote}>
              You can submit the event to a relevant EventSphere discovery page or other community calendars for a chance to be featured, so it can be discovered more easily.
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function Shell({ message, actionLabel, onAction }) {
  return (
    <div style={styles.shellOnly}>
      <div style={styles.shellCard}>
        <div style={styles.shellTitle}>{message}</div>
        {onAction && (
          <button type="button" style={styles.backBtn} onClick={onAction}>
            {actionLabel || 'Continue'}
          </button>
        )}
      </div>
    </div>
  )
}

function formatDateLong(dateString) {
  if (!dateString) return 'Date not set'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return 'Time not set'
  return [startTime, endTime].filter(Boolean).join(' - ')
}

function initials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'E'
}

function deriveNameFromEmail(email) {
  const localPart = String(email || '').split('@')[0] || ''
  const cleaned = localPart
    .replace(/[._+-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return ''

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isFreePrice(priceValue) {
  const normalized = String(priceValue ?? '').trim().toLowerCase()
  if (!normalized) return true
  if (normalized === 'free') return true
  const numeric = Number(normalized.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) && numeric <= 0
}

const styles = {
  page: { minHeight: '100vh', color: '#f1f1f5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  shellOnly: { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#101014', color: '#f1f1f5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  shellCard: { padding: 24, borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' },
  shellTitle: { fontSize: 18, marginBottom: 12 },
  topbar: { height: 72, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(14,14,18,0.7)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10 },
  brandRow: { display: 'flex', alignItems: 'center', gap: 12 },
  logo: { color: '#c4b5fd', fontSize: 22 },
  brand: { fontSize: 18, fontWeight: 700 },
  backBtn: { background: 'rgba(255,255,255,0.08)', color: '#f1f1f5', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '10px 16px', fontWeight: 800, cursor: 'pointer' },
  main: { maxWidth: 1180, margin: '0 auto', padding: '28px' },
  hero: { display: 'grid', gridTemplateColumns: '340px 1fr', gap: 22, padding: 18, borderRadius: 24, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 },
  heroMedia: { position: 'relative', minHeight: 420, borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' },
  coverImage: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  coverFallback: { position: 'absolute', inset: 0 },
  heroContent: { padding: '8px 8px 8px 0' },
  eventKicker: { color: '#b8b8c6', fontWeight: 700, marginBottom: 10 },
  title: { fontSize: 'clamp(42px, 6vw, 72px)', lineHeight: 0.95, margin: '0 0 14px', fontWeight: 800, letterSpacing: '-0.05em' },
  description: { color: '#d4d4de', fontSize: 17, lineHeight: 1.7, marginBottom: 18, maxWidth: 640 },
  metaRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 },
  metaChip: { padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: '#f1f1f5', fontSize: 13, fontWeight: 700 },
  hostRow: { display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' },
  hostAvatar: { width: 44, height: 44, borderRadius: '50%', background: '#f5c842', color: '#111', display: 'grid', placeItems: 'center', fontWeight: 800 },
  hostName: { fontWeight: 800, fontSize: 15 },
  hostEmail: { color: '#a9a9b6', fontSize: 13 },
  contentGrid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 18, alignItems: 'start' },
  panel: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 18 },
  panelWide: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 18, gridColumn: '1 / -1' },
  panelHead: { fontSize: 18, fontWeight: 800, marginBottom: 14 },
  successBanner: { padding: '12px 14px', borderRadius: 14, background: 'rgba(34,197,94,0.12)', color: '#86efac', marginBottom: 14, fontWeight: 700 },
  form: { display: 'grid', gap: 12 },
  field: { display: 'grid', gap: 8 },
  label: { color: '#a9a9b6', fontSize: 13, fontWeight: 700 },
  input: { width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', color: '#f1f1f5', padding: '12px 14px', fontFamily: "'DM Sans', system-ui, sans-serif" },
  textarea: { width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', color: '#f1f1f5', padding: '12px 14px', fontFamily: "'DM Sans', system-ui, sans-serif", resize: 'vertical' },
  submitBtn: { border: 'none', borderRadius: 14, padding: '12px 16px', background: '#f1f1f5', color: '#111', fontWeight: 800, cursor: 'pointer' },
  detailRow: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#d4d4de' },
  footerNote: { marginTop: 14, color: '#a9a9b6', lineHeight: 1.6 },
  ticketGrid: { display: 'grid', gap: 12 },
  ticketCard: { textAlign: 'left', width: '100%', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#f1f1f5', cursor: 'pointer' },
  ticketCardActive: { borderColor: '#f1f1f5', background: 'rgba(255,255,255,0.08)' },
  ticketCardTitle: { fontSize: 16, fontWeight: 800, marginBottom: 6 },
  ticketCardDesc: { color: '#b8b8c6', fontSize: 13, lineHeight: 1.5 },
}
