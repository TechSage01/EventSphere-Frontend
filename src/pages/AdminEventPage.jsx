import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function AdminEventPage({ user = null }) {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [data, setData] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', nomineesText: '' })

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      try {
        const token = localStorage.getItem('es_token')
        const res = await fetch(`/api/events/${eventId}/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await res.json()

        if (!res.ok) throw new Error(payload.message || 'Failed to load admin data')

        setData(payload)
        setForm({ title: '', description: '', nomineesText: '' })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [eventId])

  async function handleCreateAward(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('es_token')
      const res = await fetch(`/api/awards/events/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          nominees: form.nomineesText,
        }),
      })
      const payload = await res.json()

      if (!res.ok) throw new Error(payload.message || 'Failed to create award')

      setSuccess('Award created successfully.')
      setForm({ title: '', description: '', nomineesText: '' })
      setData(prev => prev ? { ...prev, awards: [payload.award, ...prev.awards] } : prev)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Shell message="Loading admin dashboard..." />
  if (error && !data) return <Shell message={error} actionLabel="Back to Events" onAction={() => navigate('/events')} />
  if (!data) return <Shell message="Admin data not found" actionLabel="Back to Events" onAction={() => navigate('/events')} />

  const {
    event,
    paidCount,
    freeCount,
    scannedCount = 0,
    unscannedCount = 0,
    paidTickets = [],
    scannedTickets = [],
    unscannedTickets = [],
    awards = [],
  } = data

  return (
    <div style={styles.page}>
      <header style={styles.topbar}>
        <div>
          <div style={styles.kicker}>Admin</div>
          <h1 style={styles.title}>{event.title}</h1>
        </div>
        <button type="button" style={styles.backBtn} onClick={() => navigate(`/events/${eventId}`)}>
          Back to Event
        </button>
      </header>

      <main style={styles.main}>
        <section style={styles.heroGrid}>
          <StatCard label="Paid tickets" value={paidCount} />
          <StatCard label="Free tickets" value={freeCount} />
          <StatCard label="Scanned" value={scannedCount} />
          <StatCard label="Not scanned" value={unscannedCount} />
          <StatCard label="Awards" value={awards.length} />
          <StatCard label="Votes" value={awards.reduce((total, award) => total + (award.voteCount || 0), 0)} />
        </section>

        <section style={styles.grid}>
          <div style={styles.panel}>
            <div style={styles.panelHead}>Create Award</div>
            {success && <div style={styles.success}>{success}</div>}
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={handleCreateAward} style={styles.form}>
              <label style={styles.field}>
                <span style={styles.label}>Award Title</span>
                <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} style={styles.input} placeholder="Best Dressed" required />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Description</span>
                <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} style={styles.textarea} rows={4} placeholder="Describe this award category" />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Nominees</span>
                <textarea
                  value={form.nomineesText}
                  onChange={e => setForm(prev => ({ ...prev, nomineesText: e.target.value }))}
                  style={styles.textarea}
                  rows={5}
                  placeholder="Enter up to 6 nominees, one per line or separated by commas"
                  required
                />
              </label>
              <div style={styles.helper}>At most 6 nominees per award.</div>
              <button type="submit" style={styles.primaryBtn} disabled={saving}>{saving ? 'Creating…' : 'Create Award'}</button>
            </form>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHead}>Paid Attendees</div>
            <div style={styles.list}>
              {paidTickets.length === 0 ? (
                <div style={styles.empty}>No paid tickets yet.</div>
              ) : paidTickets.map(ticket => (
                <div key={ticket.id} style={styles.listItem}>
                  <div>
                    <div style={styles.itemTitle}>{ticket.attendeeName}</div>
                    <div style={styles.itemMeta}>{ticket.attendeeEmail}</div>
                    <div style={styles.statusChipOn}>Paid ticket</div>
                  </div>
                  <div style={styles.amount}>₦{Number(ticket.price || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHead}>Checked-In Attendees</div>
            <div style={styles.list}>
              {scannedTickets.length === 0 ? (
                <div style={styles.empty}>No scanned tickets yet.</div>
              ) : scannedTickets.map(ticket => (
                <div key={ticket.id} style={styles.listItem}>
                  <div>
                    <div style={styles.itemTitle}>{ticket.attendeeName}</div>
                    <div style={styles.itemMeta}>{ticket.attendeeEmail}</div>
                    <div style={styles.statusChipOn}>Scanned {ticket.checkedInAt ? `• ${formatCheckedInAt(ticket.checkedInAt)}` : ''}</div>
                  </div>
                  <div style={styles.amount}>₦{Number(ticket.price || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHead}>Confirmed, Not Scanned Yet</div>
            <div style={styles.list}>
              {unscannedTickets.length === 0 ? (
                <div style={styles.empty}>No confirmed tickets waiting to be scanned.</div>
              ) : unscannedTickets.map(ticket => (
                <div key={ticket.id} style={styles.listItem}>
                  <div>
                    <div style={styles.itemTitle}>{ticket.attendeeName}</div>
                    <div style={styles.itemMeta}>{ticket.attendeeEmail}</div>
                    <div style={styles.statusChipOff}>Not scanned</div>
                  </div>
                  <div style={styles.amount}>₦{Number(ticket.price || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.panelWide}>
            <div style={styles.panelHead}>Awards & Votes</div>
            <div style={styles.list}>
              {awards.length === 0 ? (
                <div style={styles.empty}>No awards created yet.</div>
              ) : awards.map(award => (
                <div key={award.id} style={styles.awardItem}>
                  <div>
                    <div style={styles.itemTitle}>{award.title}</div>
                    <div style={styles.itemMeta}>{award.description || 'No description provided.'}</div>
                    <div style={styles.itemMeta}>Total votes: {award.voteCount || 0}</div>
                  </div>
                  <div style={styles.voteBox}>
                    <div style={styles.amount}>{award.voteCount || 0} votes</div>
                    <div style={styles.voteSectionLabel}>Nominee breakdown</div>
                    <div style={styles.nomineeList}>
                      {(award.nominees || []).map(nominee => (
                        <div key={nominee.name} style={styles.nomineeChip}>
                          {nominee.name} x {nominee.voteCount || 0}
                        </div>
                      ))}
                    </div>
                    <div style={styles.voteList}>
                      {(award.votes || []).slice(0, 5).map(vote => (
                        <div key={`${vote.paymentReference || vote.email}-${vote.createdAt}`} style={styles.voteChip}>
                          {vote.name} voted for {vote.nominee} x {vote.quantity || 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
        {onAction && <button type="button" style={styles.primaryBtn} onClick={onAction}>{actionLabel || 'Continue'}</button>}
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  )
}

function formatCheckedInAt(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-NG', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const styles = {
  page: { minHeight: '100vh', background: '#0f0f13', color: '#f1f1f5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  shell: { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f0f13', color: '#f1f1f5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  shellCard: { padding: 28, borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' },
  shellTitle: { fontSize: 18, marginBottom: 12 },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(16,16,20,0.82)', position: 'sticky', top: 0, backdropFilter: 'blur(18px)' },
  kicker: { color: '#a78bfa', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em' },
  title: { margin: '6px 0 0', fontSize: 'clamp(26px, 4vw, 44px)', letterSpacing: '-.04em' },
  backBtn: { border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.07)', color: '#f1f1f5', borderRadius: 999, padding: '10px 16px', fontWeight: 800, cursor: 'pointer' },
  main: { maxWidth: 1180, margin: '0 auto', padding: '28px' },
  heroGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 },
  statCard: { padding: 18, borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' },
  statLabel: { color: '#a9a9b6', fontSize: 13, marginBottom: 8 },
  statValue: { fontSize: 30, fontWeight: 900, letterSpacing: '-.04em' },
  grid: { display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16, alignItems: 'start' },
  panel: { padding: 18, borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' },
  panelWide: { gridColumn: '1 / -1', padding: 18, borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' },
  panelHead: { fontSize: 18, fontWeight: 900, marginBottom: 14 },
  form: { display: 'grid', gap: 12 },
  field: { display: 'grid', gap: 8 },
  label: { color: '#a9a9b6', fontSize: 13, fontWeight: 700 },
  input: { width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', color: '#f1f1f5', padding: '12px 14px', fontFamily: "'DM Sans', system-ui, sans-serif" },
  textarea: { width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', color: '#f1f1f5', padding: '12px 14px', fontFamily: "'DM Sans', system-ui, sans-serif", resize: 'vertical' },
  helper: { color: '#a9a9b6', fontSize: 12, marginTop: -4 },
  primaryBtn: { border: 'none', borderRadius: 14, padding: '12px 16px', background: '#f1f1f5', color: '#111', fontWeight: 800, cursor: 'pointer' },
  success: { padding: '12px 14px', borderRadius: 14, background: 'rgba(34,197,94,0.12)', color: '#86efac', marginBottom: 12, fontWeight: 700 },
  error: { padding: '12px 14px', borderRadius: 14, background: 'rgba(248,113,113,0.12)', color: '#fca5a5', marginBottom: 12, fontWeight: 700 },
  list: { display: 'grid', gap: 10 },
  empty: { color: '#a9a9b6' },
  listItem: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' },
  awardItem: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' },
  itemTitle: { fontSize: 15, fontWeight: 800 },
  itemMeta: { color: '#a9a9b6', fontSize: 13, marginTop: 4 },
  amount: { fontWeight: 900, color: '#ddd6fe' },
  voteBox: { minWidth: 180, textAlign: 'right' },
  voteSectionLabel: { marginTop: 8, color: '#a9a9b6', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' },
  statusChipOn: { display: 'inline-flex', marginTop: 8, padding: '6px 10px', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#86efac', fontSize: 12, fontWeight: 700 },
  statusChipOff: { display: 'inline-flex', marginTop: 8, padding: '6px 10px', borderRadius: 999, background: 'rgba(248,113,113,0.12)', color: '#fca5a5', fontSize: 12, fontWeight: 700 },
  nomineeList: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 10 },
  nomineeChip: { padding: '6px 10px', borderRadius: 999, background: 'rgba(59,130,246,0.14)', color: '#bfdbfe', fontSize: 12, fontWeight: 700 },
  voteList: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 10 },
  voteChip: { padding: '6px 10px', borderRadius: 999, background: 'rgba(167,139,250,0.14)', color: '#ddd6fe', fontSize: 12, fontWeight: 700 },
}
