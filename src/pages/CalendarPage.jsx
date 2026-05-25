import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function monthName(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

function weekdayShort(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
}

function buildMonthCells(viewDate) {
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const firstDayIndex = start.getDay()
  const cells = []
  const cursor = new Date(start)
  cursor.setDate(cursor.getDate() - firstDayIndex)

  for (let index = 0; index < 42; index += 1) {
    cells.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return cells
}

function buildSampleEvents(viewDate) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  return [
    { title: 'Founder Breakfast', day: 3, time: '08:30', category: 'Community', accent: '#4ade80' },
    { title: 'UX Crit Night', day: 5, time: '18:00', category: 'Workshops', accent: '#38bdf8' },
    { title: 'Rooftop Mixer', day: 9, time: '19:30', category: 'Nightlife', accent: '#fb7185' },
    { title: 'Demo Day', day: 14, time: '10:00', category: 'Featured', accent: '#fbbf24' },
    { title: 'Music After Dark', day: 20, time: '20:00', category: 'Music', accent: '#a78bfa' },
    { title: 'Creative Salon', day: 27, time: '12:00', category: 'Business', accent: '#fb923c' },
  ].map(event => ({
    ...event,
    date: new Date(year, month, event.day),
  }))
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const events = useMemo(() => buildSampleEvents(viewDate), [viewDate])
  const eventsByKey = useMemo(() => {
    return events.reduce((accumulator, event) => {
      const key = formatKey(event.date)
      if (!accumulator[key]) accumulator[key] = []
      accumulator[key].push(event)
      return accumulator
    }, {})
  }, [events])

  const cells = useMemo(() => buildMonthCells(viewDate), [viewDate])
  const upcoming = useMemo(
    () => [...events].sort((left, right) => left.date - right.date).slice(0, 5),
    [events]
  )

  function moveMonth(delta) {
    setViewDate(previous => new Date(previous.getFullYear(), previous.getMonth() + delta, 1))
  }

  return (
    <main style={styles.page}>
      {/* Dynamic injection of media query styling rules */}
      <style>{mobileOverrideStyles}</style>

      <div style={styles.glowA} aria-hidden="true" />
      <div style={styles.glowB} aria-hidden="true" />

      <header style={styles.topbar} className="nest-topbar">
        <button type="button" style={styles.brand} onClick={() => navigate('/')}>EventsNest</button>

        <nav style={styles.nav} aria-label="Calendar navigation" className="nest-nav">
          <button type="button" style={styles.navLink} onClick={() => navigate('/discover')}>Discover</button>
          <button type="button" style={styles.navLinkActive}>Calendars</button>
          <button type="button" style={styles.primaryNav} onClick={() => navigate('/events/new')}>Create event</button>
        </nav>
      </header>

      <section style={styles.hero} className="nest-hero">
        <div>
          <p style={styles.kicker}>Calendars</p>
          <h1 style={styles.title}>{monthName(viewDate)}</h1>
          <p style={styles.subtitle}>
            A clean month view for planning launches, meetups, and private events without the clutter of a generic calendar app.
          </p>
        </div>

        <div style={styles.controls} className="nest-controls">
          <button type="button" style={styles.controlBtn} onClick={() => moveMonth(-1)}>Previous</button>
          <button type="button" style={styles.controlBtnSecondary} onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>
          <button type="button" style={styles.controlBtn} onClick={() => moveMonth(1)}>Next</button>
        </div>
      </section>

      <section style={styles.summaryRow} className="nest-summary-row">
        <article style={styles.summaryCard}>
          <span style={styles.summaryValue}>{events.length}</span>
          <span style={styles.summaryLabel}>Events this month</span>
        </article>
        <article style={styles.summaryCard}>
          <span style={styles.summaryValue}>{upcoming.length}</span>
          <span style={styles.summaryLabel}>Planned highlights</span>
        </article>
        <article style={styles.summaryCard}>
          <span style={styles.summaryValue}>Lagos</span>
          <span style={styles.summaryLabel}>Primary timezone</span>
        </article>
      </section>

      <section style={styles.layout} className="nest-layout">
        <div style={styles.calendarPanel} className="nest-calendar-panel">
          <div style={styles.weekRow} className="nest-grid-7">
            {cells.slice(0, 7).map(cell => (
              <div key={weekdayShort(cell)} style={styles.weekdayLabel} className="nest-weekday-label">
                {weekdayShort(cell)}
              </div>
            ))}
          </div>

          <div style={styles.grid} className="nest-grid-7">
            {cells.map(cell => {
              const key = formatKey(cell)
              const inMonth = cell.getMonth() === viewDate.getMonth()
              const items = eventsByKey[key] || []
              const isToday = formatKey(cell) === formatKey(today)

              return (
                <article
                  key={key}
                  className={`nest-day-cell ${!inMonth ? 'nest-cell-muted' : ''}`}
                  style={{
                    ...styles.dayCell,
                    ...(inMonth ? styles.dayCellInMonth : styles.dayCellMuted),
                    ...(isToday ? styles.dayCellToday : null),
                  }}
                >
                  <div style={styles.dayHeader}>
                    <span style={styles.dayNumber}>{cell.getDate()}</span>
                    {items.length > 0 && <span style={styles.dayCount} className="nest-day-count">{items.length}</span>}
                  </div>

                  <div style={styles.eventStack} className="nest-event-stack">
                    {items.slice(0, 2).map(item => (
                      <div key={item.title} style={{ ...styles.eventChip, borderLeftColor: item.accent }}>
                        <strong style={styles.eventTime}>{item.time}</strong>
                        <span style={styles.eventTitle} title={item.title}>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <aside style={styles.sidebar} className="nest-sidebar">
          <section style={styles.sidebarPanel}>
            <div style={styles.sidebarHead}>Upcoming agenda</div>
            <div style={styles.agendaList}>
              {upcoming.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No events scheduled</p>
              ) : (
                upcoming.map(item => (
                  <article key={item.title} style={styles.agendaItem}>
                    <div style={styles.agendaDate}>
                      <span style={styles.agendaDateMonth}>
                        {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(item.date)}
                      </span>
                      <span style={styles.agendaDateDay}>
                        {item.date.getDate()}
                      </span>
                    </div>
                    <div style={styles.agendaBody}>
                      <strong style={styles.agendaTitle}>{item.title}</strong>
                      <span style={styles.agendaMeta}>{item.category} · {item.time}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section style={styles.sidebarPanel}>
            <div style={styles.sidebarHead}>Planner mode</div>
            <p style={styles.sidebarCopy}>
              This page is intentionally simple: a readable month grid, a focused agenda, and clear space for the details that matter.
            </p>
            <button type="button" style={styles.sidebarBtn} onClick={() => navigate('/events/new')}>
              Add an event
            </button>
          </section>
        </aside>
      </section>
    </main>
  )
}

/* --- Responsive CSS String --- */
const mobileOverrideStyles = `
  @media (max-width: 488px) {
    /* 1. Header & Navigation Reflow */
    .nest-topbar {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 16px !important;
      margin-bottom: 24px !important;
    }
    .nest-nav {
      width: 100% !important;
      justify-content: space-between !important;
    }
    .nest-nav button {
      padding: 6px 12px !important;
      font-size: 12px !important;
      flex: 1 !important;
      text-align: center !important;
    }

    /* 2. Hero & Controls */
    .nest-hero {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 16px !important;
    }
    .nest-controls {
      width: 100% !important;
      display: flex !important;
    }
    .nest-controls button {
      flex: 1 !important;
      text-align: center !important;
    }

    /* 3. Stat Cards to Single Column Stack */
    .nest-summary-row {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }

    /* 4. Layout Panels Stack */
    .nest-layout {
      grid-template-columns: 1fr !important;
      gap: 24px !important;
    }
    .nest-calendar-panel {
      padding: 12px !important;
    }

    /* 5. Calendar Grid Shrinkage Rules */
    .nest-grid-7 {
      gap: 4px !important;
    }
    .nest-weekday-label {
      font-size: 10px !important;
      letter-spacing: 0px !important;
    }
    .nest-day-cell {
      min-height: 55px !important;
      padding: 6px !important;
      justify-content: flex-start !important;
      position: relative !important;
    }
    .nest-day-count {
      display: none !important; /* Save cell space */
    }

    /* Hide text event chips on mobile grids to prevent breaking cell squares */
    .nest-event-stack {
      display: none !important;
    }

    /* Generate a minimal visual colored status dot under the date instead */
    .nest-day-cell:has(.nest-event-stack > div)::after {
      content: '';
      display: block;
      width: 5px;
      height: 5px;
      background-color: #4ade80;
      border-radius: 50%;
      margin: 4px auto 0;
    }
  }

  @media (max-width: 360px) {
    /* 6. Ultra Tight Device Overrides (down to 320px) */
    .nest-day-cell {
      min-height: 46px !important;
      padding: 4px !important;
    }
    .nest-day-cell span {
      font-size: 11px !important;
    }
    /* Hide out-of-month dates entirely on sub-360px width to keep calendar clean */
    .nest-cell-muted {
      visibility: hidden !important; 
    }
  }
`

/* --- Base JS Desktop Styles --- */
const styles = {
  page: {
    position: 'relative',
    minHeight: '100svh',
    overflowX: 'hidden',
    padding: '24px clamp(12px, 4vw, 40px) 48px',
    color: '#f4f4f7',
    background: '#0a0b10 linear-gradient(180deg, #12131a 0%, #07080c 100%)',
    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  glowA: {
    position: 'absolute',
    left: '-5%',
    top: '5%',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(74,222,128,0.12), transparent 70%)',
    filter: 'blur(40px)',
    pointerEvents: 'none',
  },
  glowB: {
    position: 'absolute',
    right: '-5%',
    top: '15%',
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,189,248,0.1), transparent 70%)',
    filter: 'blur(40px)',
    pointerEvents: 'none',
  },
  topbar: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 36,
  },
  brand: {
    border: 0,
    background: 'transparent',
    color: '#fff',
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    cursor: 'pointer',
  },
  nav: { display: 'inline-flex', alignItems: 'center', gap: 8 },
  navLink: {
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.03)',
    color: 'rgba(255,255,255,0.75)',
    borderRadius: 999,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  navLinkActive: {
    border: '1px solid rgba(74,222,128,0.25)',
    background: 'rgba(74,222,128,0.1)',
    color: '#4ade80',
    borderRadius: 999,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'default',
  },
  primaryNav: {
    border: 0,
    background: '#fff',
    color: '#0d0e12',
    borderRadius: 999,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  hero: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 24,
    flexWrap: 'wrap',
    marginBottom: 28,
  },
  kicker: {
    margin: '0 0 10px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#4ade80',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(2.3rem, 5vw, 4rem)',
    fontWeight: 700,
    lineHeight: 1.0,
    letterSpacing: '-0.05em',
    color: '#fff',
  },
  subtitle: {
    maxWidth: 640,
    margin: '14px 0 0',
    fontSize: 15,
    lineHeight: 1.6,
    color: 'rgba(255,255,255,0.6)',
  },
  controls: {
    display: 'inline-flex',
    gap: 8,
    background: 'rgba(255,255,255,0.03)',
    padding: 4,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  controlBtn: {
    height: 38,
    padding: '0 14px',
    borderRadius: 10,
    border: 0,
    background: 'transparent',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  controlBtnSecondary: {
    height: 38,
    padding: '0 14px',
    borderRadius: 10,
    border: 0,
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  summaryRow: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    padding: '20px 24px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  summaryValue: { display: 'block', fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: '#fff' },
  summaryLabel: { display: 'block', marginTop: 4, color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 500 },
  layout: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: 20,
  },
  calendarPanel: {
    padding: 20,
    borderRadius: 24,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  weekRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    gap: 8,
    marginBottom: 12,
  },
  weekdayLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    gap: 8,
  },
  dayCell: {
    minHeight: 120,
    padding: 10,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    border: '1px solid transparent',
    transition: 'background 0.2s ease',
  },
  dayCellInMonth: {
    background: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.04)',
  },
  dayCellMuted: {
    background: 'transparent',
    opacity: 0.25,
  },
  dayCellToday: {
    borderColor: 'rgba(74,222,128,0.4)',
    background: 'rgba(74,222,128,0.04)',
  },
  dayHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, width: '100%' },
  dayNumber: { fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' },
  dayCount: {
    padding: '2px 6px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: 600,
  },
  eventStack: { display: 'grid', gap: 6, width: '100%' },
  eventChip: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    padding: '6px 8px',
    borderRadius: 8,
    background: 'rgba(0,0,0,0.25)',
    borderLeft: '3px solid #fff',
    overflow: 'hidden',
  },
  eventTime: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 },
  eventTitle: { 
    fontSize: 11, 
    fontWeight: 600, 
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  sidebar: { display: 'grid', gap: 20, alignContent: 'start' },
  sidebarPanel: {
    padding: 24,
    borderRadius: 24,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  sidebarHead: { fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' },
  agendaList: { display: 'grid', gap: 14, marginTop: 16 },
  agendaItem: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    paddingBottom: 14,
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  agendaDate: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  agendaDateMonth: { fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 },
  agendaDateDay: { fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.1 },
  agendaBody: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  agendaTitle: { fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  agendaMeta: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  sidebarCopy: { margin: '12px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 },
  sidebarBtn: {
    marginTop: 20,
    width: '100%',
    height: 42,
    borderRadius: 12,
    border: 0,
    background: '#fff',
    color: '#0d0e12',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
}