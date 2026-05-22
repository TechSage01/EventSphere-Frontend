import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * EventsPage — dark Luma-style dashboard
 *
 * Drop this into your router at /events.
 * It expects a `user` prop (or null if not logged in).
 * If user is null, redirect to /signup from your router (see notes below).
 */
export default function EventsPage({ user = null }) {
  const [tab, setTab] = useState('upcoming') // 'upcoming' | 'past'
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logoutPending, setLogoutPending] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    if (logoutPending) return
    setLogoutPending(true)
    await logout()
    navigate('/signup', { replace: true })
  }

  useEffect(() => {
    async function loadEvents() {
      setLoading(true)
      setError('')

      try {
        const token = localStorage.getItem('es_token')
        const res = await fetch('/api/events', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const payload = await res.json()

        if (!res.ok) throw new Error(payload.message || 'Failed to load events')

        setEvents(Array.isArray(payload.data?.events) ? payload.data.events : [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  const upcomingEvents = useMemo(() => events.filter(isUpcoming), [events])
  const pastEvents = useMemo(() => events.filter(event => !isUpcoming(event)), [events])
  const visibleEvents = tab === 'upcoming' ? upcomingEvents : pastEvents

  return (
    <div style={styles.shell}>
      {/* ── TOPBAR ── */}
      <header style={styles.topbar}>
        <nav style={styles.topbarLeft}>
          {/* Luma star logo */}
          <span style={styles.starLogo} aria-label="EventSphere">✦</span>

          <a href="/events"    style={styles.navItem} data-active="true">
            <span style={styles.navIcon}>▦</span> Events
          </a>
          <a href="/calendars" style={{ ...styles.navItem, color: '#8a8a8a' }}>
            <span style={styles.navIcon}>📅</span> Calendars
          </a>
          <a href="/discover"  style={{ ...styles.navItem, color: '#8a8a8a' }}>
            <span style={styles.navIcon}>◎</span> Discover
          </a>
        </nav>

        <div style={styles.topbarRight}>
          <span style={styles.timeChip}>{useCurrentTime()}</span>

          <button type="button" style={styles.createBtn} onClick={() => navigate('/events/new')}>
            Create Event
          </button>

          <button type="button" style={styles.logoutBtn} onClick={handleLogout} disabled={logoutPending}>
            {logoutPending ? 'Signing out...' : 'Logout'}
          </button>

          {/* search */}
          <button style={styles.iconBtn} aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {/* notification bell */}
          <button style={styles.iconBtn} aria-label="Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>

          {/* avatar */}
          <div style={styles.avatar}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
              : <span style={{ fontSize: 18 }}>🙂</span>
            }
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={styles.main}>
        {/* page header row */}
        <div style={styles.pageHead}>
          <h1 style={styles.pageTitle}>Events</h1>

          {/* upcoming / past toggle */}
          <div style={styles.toggle} role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'upcoming'}
              style={{ ...styles.toggleBtn, ...(tab === 'upcoming' ? styles.toggleBtnActive : {}) }}
              onClick={() => setTab('upcoming')}
            >
              Upcoming
            </button>
            <button
              role="tab"
              aria-selected={tab === 'past'}
              style={{ ...styles.toggleBtn, ...(tab === 'past' ? styles.toggleBtnActive : {}) }}
              onClick={() => setTab('past')}
            >
              Past
            </button>
          </div>
        </div>

        {/* ── content ── */}
        {loading ? (
          <EmptyState tab={tab} navigate={navigate} message="Loading events..." />
        ) : error ? (
          <EmptyState tab={tab} navigate={navigate} message={error} />
        ) : visibleEvents.length === 0 ? (
          <EmptyState tab={tab} navigate={navigate} />
        ) : (
          <div style={styles.evGrid}>
            {visibleEvents.map(ev => <EventCard key={ev.id} ev={ev} onOpen={() => navigate(`/events/${ev.id}`)} />)}
          </div>
        )}
      </main>
    </div>
  )
}

/* ─── empty state ─── */
function EmptyState({ tab, navigate, message = '' }) {
  return (
    <div style={styles.emptyWrap}>
      {/* big calendar icon with 0 badge */}
      <div style={styles.emptyIconWrap}>
        <div style={styles.emptyIcon}>
          {/* calendar illustration */}
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="6" y="14" width="56" height="54" rx="8" fill="#2a2a2e" stroke="#3a3a40" strokeWidth="1.5"/>
            <rect x="6" y="14" width="56" height="16" rx="8" fill="#323238" stroke="#3a3a40" strokeWidth="1.5"/>
            <rect x="16" y="36" width="18" height="4" rx="2" fill="#4a4a52"/>
            <rect x="16" y="46" width="12" height="4" rx="2" fill="#3e3e46"/>
            <rect x="34" y="46" width="12" height="4" rx="2" fill="#3e3e46"/>
            <rect x="16" y="56" width="8" height="8" rx="2" fill="#3e3e46"/>
            <rect x="30" y="56" width="8" height="8" rx="2" fill="#4a4a52"/>
            <rect x="44" y="36" width="10" height="4" rx="2" fill="#3e3e46"/>
            {/* badge */}
            <circle cx="54" cy="20" r="14" fill="#2a2a2e" stroke="#3a3a40" strokeWidth="1.5"/>
            <text x="54" y="26" textAnchor="middle" fill="#6b6b76" fontSize="16" fontWeight="700" fontFamily="system-ui">0</text>
          </svg>
        </div>
      </div>

      <h2 style={styles.emptyTitle}>
        {message || (tab === 'upcoming' ? 'No Upcoming Events' : 'No Past Events')}
      </h2>
      {!message && (
        <p style={styles.emptyBody}>
          {tab === 'upcoming'
            ? 'You have no upcoming events. Why not host one?'
            : 'You haven\'t hosted or attended any events yet.'
          }
        </p>
      )}

      <button type="button" style={styles.createBtnLarge} onClick={() => navigate('/events/new')}>
        <span style={{ marginRight: 6, fontSize: 16 }}>+</span>
        Create Event
      </button>
    </div>
  )
}

function isUpcoming(event) {
  const eventDate = new Date(`${event.startDate}T${event.startTime || '00:00'}`)
  return Number.isNaN(eventDate.getTime()) ? true : eventDate.getTime() >= Date.now()
}

/* ─── event card (for when there ARE events) ─── */
function EventCard({ ev, onOpen }) {
  const dateLabel = formatEventDate(ev.startDate)
  const timeLabel = [ev.startTime, ev.endTime].filter(Boolean).join(' - ')
  const statusLabel = ev.isPublic ? 'Public' : 'Private'

  return (
    <div style={styles.card} onClick={onOpen} role="button" tabIndex={0}>
      <div style={{ ...styles.cardCover, background: ev.color || '#2a2a2e' }}>
        <span style={{ fontSize: 36 }}>{ev.emoji || '📅'}</span>
      </div>
      <div style={styles.cardBody}>
        <p style={styles.cardDate}>{dateLabel}</p>
        <p style={styles.cardTitle}>{ev.title}</p>
        <p style={styles.cardLoc}>{ev.location ? `📍 ${ev.location}` : '📍 Location not set'}</p>
        <p style={styles.cardLoc}>{timeLabel}</p>
        <div style={styles.cardFoot}>
          <span style={styles.cardGoing}>{ev.hostName || ev.hostEmail || 'Creator'} </span>
          <span style={{ ...styles.cardTag, background: ev.isPublic ? '#1f3d2c' : '#3a2431', color: ev.isPublic ? '#86efac' : '#f9a8d4' }}>{statusLabel}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── tiny clock hook ─── */
function useCurrentTime() {
  const [t, setT] = useState(() => fmt())
  // update every minute — use useEffect in real code
  return t
}
function fmt() {
  return new Intl.DateTimeFormat('en-NG', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Africa/Lagos', timeZoneName: 'short',
  }).format(new Date())
}

function formatEventDate(dateString) {
  if (!dateString) return 'Date not set'

  const eventDate = new Date(dateString)
  if (Number.isNaN(eventDate.getTime())) return dateString

  return new Intl.DateTimeFormat('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(eventDate)
}

/* ─── styles ─── */
const styles = {
  shell: {
    minHeight: '100vh',
    background: '#14141a',
    color: '#e8e8ec',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },

  /* topbar */
  topbar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    height: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    background: 'rgba(20,20,26,0.85)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  starLogo: {
    fontSize: 18,
    color: '#a78bfa',
    marginRight: 16,
    cursor: 'pointer',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13.5,
    fontWeight: 500,
    color: '#e8e8ec',
    textDecoration: 'none',
    padding: '5px 11px',
    borderRadius: 8,
    transition: 'background .12s',
    cursor: 'pointer',
  },
  navIcon: { fontSize: 13, opacity: .75 },

  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  timeChip: {
    fontSize: 12,
    color: '#6b6b76',
    fontVariantNumeric: 'tabular-nums',
    marginRight: 4,
  },
  createBtn: {
    fontSize: 12.5,
    fontWeight: 600,
    color: '#e8e8ec',
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '6px 14px',
    borderRadius: 999,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background .12s',
  },
  logoutBtn: {
    fontSize: 12.5,
    fontWeight: 600,
    color: '#f0f0f4',
    background: 'rgba(248,113,113,0.13)',
    border: '1px solid rgba(248,113,113,0.3)',
    padding: '6px 12px',
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'opacity .12s',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: '#6b6b76',
    cursor: 'pointer',
    padding: 6,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color .12s',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: '#f5c842',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
  },

  /* main */
  main: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '40px 28px 80px',
  },
  pageHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-.5px',
    color: '#f0f0f4',
  },

  /* toggle */
  toggle: {
    display: 'flex',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    fontSize: 13,
    fontWeight: 500,
    color: '#6b6b76',
    background: 'none',
    border: 'none',
    padding: '6px 16px',
    borderRadius: 7,
    cursor: 'pointer',
    transition: 'background .12s, color .12s',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  toggleBtnActive: {
    background: 'rgba(255,255,255,0.10)',
    color: '#f0f0f4',
  },

  /* empty state */
  emptyWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 60,
    textAlign: 'center',
  },
  emptyIconWrap: {
    marginBottom: 28,
  },
  emptyIcon: {
    opacity: .85,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: '#8a8a96',
    marginBottom: 10,
    letterSpacing: '-.3px',
  },
  emptyBody: {
    fontSize: 14,
    color: '#55555e',
    marginBottom: 32,
    lineHeight: 1.6,
  },
  createBtnLarge: {
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    color: '#e8e8ec',
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.13)',
    padding: '11px 24px',
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'background .15s',
  },

  /* event cards (for filled state) */
  evGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#1c1c24',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform .18s, box-shadow .18s',
  },
  cardCover: {
    height: 110,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: '12px 14px 14px' },
  cardDate:  { fontSize: 11, color: '#6b6b76', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#e8e8ec', marginBottom: 5, lineHeight: 1.3 },
  cardLoc:   { fontSize: 12, color: '#55555e', marginBottom: 10 },
  cardFoot:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardGoing: { fontSize: 11, color: '#6b6b76' },
  cardTag:   { fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999 },
}
