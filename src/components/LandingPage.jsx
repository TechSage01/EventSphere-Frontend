import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import screenImage from '../assets/screen.png'
import phoneVideo from '../assets/phone-dark.webm'
import './LandingPage.css'

const featureCards = [
  {
    title: 'Beautiful event pages',
    copy: 'Create clean, focused pages that look premium from the first scroll.',
  },
  {
    title: 'Invites people actually open',
    copy: 'Share one link for RSVP, tickets, and event details without clutter.',
  },
  {
    title: 'Simple day-of flow',
    copy: 'Keep attendees organized with a landing page that stays calm and readable.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Design the page',
    copy: 'Set the mood, add the details, and keep the focus on the event.',
  },
  {
    number: '02',
    title: 'Share the invite',
    copy: 'Send one polished link that works for social, email, and direct messages.',
  },
  {
    number: '03',
    title: 'Run the night',
    copy: 'Use the same page to guide guests from discovery to check-in.',
  },
]

const tags = ['Launches', 'Meetups', 'Parties', 'Conferences', 'Workshops', 'Community']

function formatNigeriaTime(date) {
  return new Intl.DateTimeFormat('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
    timeZoneName: 'short',
  }).format(date)
}

function LandingPage() {
  const [lagosTime, setLagosTime] = useState(() => formatNigeriaTime(new Date()))
  const navigate = useNavigate()

  useEffect(() => {
    const updateClock = () => setLagosTime(formatNigeriaTime(new Date()))
    updateClock()

    const timerId = window.setInterval(updateClock, 60_000)
    return () => window.clearInterval(timerId)
  }, [])

  return (
    <main className="landing-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => navigate('/home')} aria-label="EventSphere home">
          <span className="brand-badge">
            <img className="brand-mark" src={screenImage} alt="EventSphere" />
          </span>
        </button>

        <nav className="topnav" aria-label="Primary">
          <span className="topnav-time">{lagosTime}</span>
          <button type="button" className="nav-link" onClick={() => navigate('/events')}>
            Discover Events
          </button>
          <button type="button" className="signin" onClick={() => navigate('/signup')}>
            Get Started
          </button>
        </nav>
      </header>

      <section className="hero-layout" id="discover">
        <div className="hero-copy">
          <p className="eyebrow">A premium home for your event brand</p>
          <h1>
            Delightful
            <br />
            events
          </h1>
          <h2 className="gradient-line">start here.</h2>
          <p className="lede">
            Set up an event page, invite friends, and sell tickets from one clean, cinematic home.
            Keep the experience simple for guests and polished on every device.
          </p>

          <div className="hero-actions">
            <button type="button" className="primary-btn" onClick={() => navigate('/signup')}>
              Create your first event
            </button>
            <button type="button" className="secondary-btn" onClick={() => navigate('/events')}>
              Learn more
            </button>
          </div>

          <ul className="stats-row" aria-label="EventSphere highlights">
            <li>
              <strong>Fast</strong>
              <span>launch pages in minutes</span>
            </li>
            <li>
              <strong>Clean</strong>
              <span>focus on the event, not the UI</span>
            </li>
            <li>
              <strong>Local</strong>
              <span>Nigeria time in the header</span>
            </li>
          </ul>
        </div>

        <div className="media-panel" aria-label="Event preview">
          <div className="media-orb" aria-hidden="true" />
          <div className="media-halo" aria-hidden="true" />
          <div className="spark spark-left" aria-hidden="true" />
          <div className="spark spark-right" aria-hidden="true" />
          <div className="floating-card floating-card-left">
            <span className="floating-kicker">NEW</span>
            <strong>Run a sold-out night.</strong>
            <p>Simple details, premium presentation, and a clean RSVP path.</p>
          </div>
          <div className="phone-frame">
            <video className="phone-video" autoPlay loop muted playsInline preload="auto">
              <source src={phoneVideo} type="video/webm" />
            </video>
          </div>
          <div className="floating-card floating-card-right">
            <span className="floating-kicker">LIVE</span>
            <strong>Keep guests in the loop.</strong>
            <p>Share one page for tickets, updates, and event details.</p>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Event types">
        {tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </section>

      <section className="content-section" id="learn">
        <div className="section-heading">
          <p className="eyebrow">Why it feels good</p>
          <h3>Built to feel calm, modern, and expensive.</h3>
          <p>
            The layout keeps the visual language dark and cinematic so the event content stays in
            the spotlight instead of fighting with the interface.
          </p>
        </div>

        <div className="feature-grid">
          {featureCards.map((card) => (
            <article className="feature-card" key={card.title}>
              <h4>{card.title}</h4>
              <p>{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" id="create">
        <div className="workflow-panel">
          <div className="workflow-copy">
            <p className="eyebrow">How it comes together</p>
            <h3>Everything on one page, without the page feeling crowded.</h3>
            <p>
              Use this home screen for launches, club nights, conferences, or workshops. Keep the
              content structured, then let the visuals do the heavy lifting.
            </p>
          </div>

          <div className="workflow-steps">
            {steps.map((step) => (
              <article className="workflow-step" key={step.number}>
                <span>{step.number}</span>
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="showcase-card" aria-label="Event summary">
          <div className="showcase-top">
            <span className="showcase-dot" />
            <span>Tonight in Lagos</span>
          </div>
          <h4>Sunset Sessions</h4>
          <p>Music, networking, and a clean RSVP flow for 300+ guests.</p>

          <div className="showcase-art">
            <img src={screenImage} alt="EventSphere mark" />
          </div>

          <dl className="showcase-meta">
            <div>
              <dt>Time</dt>
              <dd>7:00 PM</dd>
            </div>
            <div>
              <dt>Guests</dt>
              <dd>248 confirmed</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Tickets live</dd>
            </div>
          </dl>
        </aside>
      </section>

      <footer className="footer">
        <div>
          <strong>EventSphere</strong>
          <p>Modern event home pages with a premium first impression.</p>
        </div>
        <div className="footer-links">
          <button type="button" onClick={() => navigate('/events')}>Discover</button>
          <button type="button" onClick={() => navigate('/events')}>Features</button>
          <button type="button" onClick={() => navigate('/signup')}>Create</button>
          <button type="button" onClick={() => navigate('/signup')}>Get Started</button>
        </div>
      </footer>
    </main>
  )
}

export default LandingPage