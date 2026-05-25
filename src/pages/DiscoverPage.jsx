import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './DiscoverPage.css'

const filters = ['All', 'Featured', 'Music', 'Business', 'Community', 'Workshops', 'Nightlife']

const events = [
  {
    title: 'Moonlight Mixer',
    category: 'Business',
    date: 'Fri, Jun 6',
    time: '6:30 PM',
    city: 'Lagos',
    venue: 'The Pier House',
    price: 'Free',
    going: '182 going',
    accent: '#a78bfa',
    summary: 'Founders, operators, and designers meet over drinks and sharp ideas.',
  },
  {
    title: 'After Hours Soundcheck',
    category: 'Music',
    date: 'Sat, Jun 7',
    time: '8:00 PM',
    city: 'Abuja',
    venue: 'Warehouse 9',
    price: 'From ₦15,000',
    going: '341 going',
    accent: '#38bdf8',
    summary: 'A late-night live set with low lights, warm bass, and strong energy.',
  },
  {
    title: 'Creative People Breakfast',
    category: 'Community',
    date: 'Sun, Jun 8',
    time: '9:00 AM',
    city: 'Port Harcourt',
    venue: 'Palm Studio',
    price: 'Free',
    going: '96 going',
    accent: '#4ade80',
    summary: 'A calm morning for makers, freelancers, and small teams.',
  },
  {
    title: 'Brand Sprint Lab',
    category: 'Workshops',
    date: 'Tue, Jun 10',
    time: '11:00 AM',
    city: 'Lagos',
    venue: 'North Loop',
    price: '₦20,000',
    going: '74 going',
    accent: '#fb923c',
    summary: 'A practical session on positioning, landing pages, and event growth.',
  },
  {
    title: 'Rooftop Selects',
    category: 'Nightlife',
    date: 'Fri, Jun 13',
    time: '7:30 PM',
    city: 'Lagos',
    venue: 'Skyline Deck',
    price: 'From ₦25,000',
    going: '255 going',
    accent: '#fb7185',
    summary: 'Cocktails, skyline views, and a crowd that arrives dressed to be seen.',
  },
  {
    title: 'Product Demo Night',
    category: 'Featured',
    date: 'Wed, Jun 18',
    time: '5:45 PM',
    city: 'Abuja',
    venue: 'Civic Hall',
    price: 'Free',
    going: '207 going',
    accent: '#fbbf24',
    summary: 'Startups present in a polished room built for attention and momentum.',
  },
]

const highlights = [
  { label: 'Cities this week', value: '12' },
  { label: 'Featured drops',   value: '48' },
  { label: 'Avg. attendance',  value: '180' },
]

const sidePicks = [
  'Tech meetups',
  'Dinner salons',
  'Creative workshops',
  'Night markets',
  'Networking brunches',
]

export default function DiscoverPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All')
  const [menuOpen, setMenuOpen] = useState(false)

  const visibleEvents = useMemo(() => {
    if (activeFilter === 'All') return events
    return events.filter(e => e.category === activeFilter)
  }, [activeFilter])

  return (
    <main className="dp-page">
      <div className="dp-glow-a" aria-hidden="true" />
      <div className="dp-glow-b" aria-hidden="true" />

      {/* ── Topbar ── */}
      <header className="dp-topbar">
        <button type="button" className="dp-brand" onClick={() => navigate('/')} aria-label="NEST home">
          NEST<span className="dp-brand-star">✦</span>
        </button>

        <nav className="dp-nav" aria-label="Discover navigation">
          <button type="button" className="dp-nav-active">Discover</button>
          <button type="button" className="dp-nav-link" onClick={() => navigate('/home/calendars')}>Calendars</button>
          <button type="button" className="dp-nav-primary" onClick={() => navigate('/events/new')}>
            Create event
          </button>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="dp-menu-toggle"
            aria-label="Open menu"
            onClick={() => setMenuOpen(v => !v)}
          >
            <span /><span /><span />
          </button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="dp-hero">
        <div className="dp-hero-copy">
          <p className="dp-kicker">Discover what&apos;s happening</p>
          <h1 className="dp-title">
            Curated events,<br />
            <em>built to browse</em> beautifully.
          </h1>
          <p className="dp-subtitle">
            Browse standout launches, intimate gatherings, and high-energy nights in a
            layout that feels closer to a magazine than a directory.
          </p>

          <div className="dp-search-row">
            <input
              type="search"
              className="dp-search-input"
              placeholder="Search cities, hosts, or event types"
              aria-label="Search events"
            />
            <button type="button" className="dp-search-btn" onClick={() => navigate('/events/new')}>
              Create your own
            </button>
          </div>

          <div className="dp-highlights">
            {highlights.map(item => (
              <article key={item.label} className="dp-highlight-card">
                <span className="dp-highlight-val">{item.value}</span>
                <span className="dp-highlight-lbl">{item.label}</span>
              </article>
            ))}
          </div>
        </div>

        <aside className="dp-hero-aside" aria-label="Browse picks">
          <div className="dp-feature-panel">
            <span className="dp-feature-pill">Featured</span>
            <h2 className="dp-feature-title">A better way to find your next night out.</h2>
            <p className="dp-feature-copy">
              Explore event types that feel hand-picked, with enough breathing room to
              scan quickly and decide fast.
            </p>
            <div className="dp-side-list">
              {sidePicks.map(item => (
                <div key={item} className="dp-side-item">{item}</div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {/* ── Filters ── */}
      <div className="dp-filter-row" role="group" aria-label="Event filters">
        {filters.map(filter => (
          <button
            key={filter}
            type="button"
            className={filter === activeFilter ? 'dp-filter-active' : 'dp-filter'}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="dp-content">

        {/* Event cards */}
        <section className="dp-event-grid" aria-label="Event listings">
          {visibleEvents.length === 0 && (
            <p style={{ color: 'var(--text-3)', padding: '32px 0', gridColumn: '1/-1' }}>
              No events in this category yet.
            </p>
          )}
          {visibleEvents.map(event => (
            <article key={event.title} className="dp-event-card" onClick={() => navigate('/events/new')}>
              <div className="dp-card-glow" style={{ background: event.accent }} />

              <div className="dp-card-top">
                <div>
                  <div className="dp-card-date">{event.date}</div>
                  <div className="dp-card-time">{event.time}</div>
                </div>
                <span className="dp-card-tag">{event.category}</span>
              </div>

              <h3 className="dp-card-title">{event.title}</h3>
              <p className="dp-card-summary">{event.summary}</p>

              <div className="dp-card-meta">
                <span>{event.city}</span>
                <span>{event.venue}</span>
                <span>{event.price}</span>
              </div>

              <div className="dp-card-footer">
                <span className="dp-card-going">{event.going}</span>
                <button
                  type="button"
                  className="dp-card-btn"
                  onClick={e => { e.stopPropagation(); navigate('/events/new') }}
                >
                  Use this vibe
                </button>
              </div>
            </article>
          ))}
        </section>

        {/* Sidebar */}
        <aside className="dp-sidebar">
          <section className="dp-sidebar-panel">
            <div className="dp-sidebar-head">Popular cities</div>
            <div className="dp-city-list">
              {['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Enugu'].map(city => (
                <div key={city} className="dp-city-row">
                  <span>{city}</span>
                  <span className="dp-city-live">Live</span>
                </div>
              ))}
            </div>
          </section>

          <section className="dp-sidebar-panel">
            <div className="dp-sidebar-head">Why browse here</div>
            <p className="dp-sidebar-copy">
              Discovery works best when the layout stays calm. This page keeps the
              interface simple so the events do the selling.
            </p>
            <button
              type="button"
              className="dp-sidebar-btn"
              onClick={() => navigate('/home/calendars')}
            >
              Open calendars →
            </button>
          </section>
        </aside>
      </div>
    </main>
  )
}