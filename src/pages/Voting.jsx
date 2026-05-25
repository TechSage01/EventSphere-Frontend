import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function deriveNameFromEmail(email) {
  const local = String(email || '').split('@')[0] || ''
  return local.replace(/[._+-]+/g, ' ').trim()
    .split(' ').filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

function formatDateLong(d) {
  if (!d) return 'Date TBC'
  const date = new Date(d)
  return isNaN(date.getTime()) ? d
    : new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function formatTimeRange(s, e) {
  if (!s && !e) return 'Time TBC'
  return [s, e].filter(Boolean).join(' – ')
}

function slugify(v) {
  return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function resolveNomineeName(award, input) {
  if (!award) return ''
  const target = String(input || '').trim().toLowerCase()
  if (!target) return ''
  const nominees = Array.isArray(award.nominees) ? award.nominees : []
  const match = nominees.find(n =>
    slugify(n?.name || n) === target ||
    String(n?.name || n).trim().toLowerCase() === target
  )
  return match?.name || match || ''
}

function formatDisplay(v) {
  const raw = String(v || '').split('@')[0] || ''
  return raw.replace(/[._+-]+/g, ' ').trim()
    .split(' ').filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

function formatMoney(amount) {
  return `₦${Number(amount || 0).toLocaleString()}`
}

function estimateFee(amount) {
  const value = Number(amount || 0)
  if (!value) return 0

  const variableFee = Math.round(value * 0.015)
  const flatFee = 1
  return variableFee + flatFee
}

async function verifyVotePayment(ctx, response) {
  const { apiBase, eventId, awardId, voteReference, quantity, name, email, nominee, setAwards, setVoteMessage, navigate, backUrl } = ctx
  try {
    const res  = await fetch(`${apiBase}/awards/events/${eventId}/${awardId}/vote`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: response.reference || voteReference, name, email, quantity, nominee }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to verify vote payment')
    setAwards(prev => prev.map(a =>
      a.id === awardId
        ? { ...a, voteCount: data.award?.voteCount ?? a.voteCount, voterCount: data.award?.voterCount ?? a.voterCount }
        : a
    ))
    navigate(
      `/thank-you?type=vote&back=${encodeURIComponent(backUrl)}&title=${encodeURIComponent('Thank you for voting')}&subtitle=${encodeURIComponent('Your vote has been recorded successfully. You can revote for a friend next.')}`,
      { replace: true }
    )
  } catch (err) {
    setVoteMessage(err.message)
  }
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function VotingPage() {
  const { eventId, awardId, nomineeSlug } = useParams()
  const navigate = useNavigate()
  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
  const API_BASE = import.meta.env.VITE_API_URL || 'https://eventsphere-backend-swqw.onrender.com/api'

  const [event,    setEvent]    = useState(null)
  const [awards,   setAwards]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [voteMsg,  setVoteMsg]  = useState('')
  const [votingId, setVotingId] = useState('')
  const [quantities, setQuantities] = useState({})
  const [selected,   setSelected]   = useState({})
  const [form,     setForm]     = useState({ name: '', email: '' })

  /* poster upload state */
  const [posterUrl,  setPosterUrl]  = useState(null)
  const [posterDrag, setPosterDrag] = useState(false)
  const fileRef = useRef()

  /* Responsive hook tracking window scale */
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768
  const isTablet = windowWidth < 1024

  /* auto-fill name from email */
  useEffect(() => {
    if (!form.email) return
    const derived = deriveNameFromEmail(form.email)
    setForm(prev => {
      if (prev.name && prev.name !== deriveNameFromEmail(prev.email)) return prev
      return { ...prev, name: derived }
    })
  }, [form.email])

  /* load Paystack inline.js */
  useEffect(() => {
    if (window.PaystackPop) return
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    s.async = true
    document.body.appendChild(s)
    return () => { try { document.body.removeChild(s) } catch {} }
  }, [])

  /* load event + awards */
  useEffect(() => {
    async function load() {
      setLoading(true); setError('')
      try {
        const [evRes, awRes] = await Promise.all([
          fetch(`${API_BASE}/events/public/${eventId}`),
          fetch(`${API_BASE}/awards/events/${eventId}`),
        ])
        const evData = await evRes.json()
        const awData = await awRes.json()
        if (!evRes.ok) throw new Error(evData.message || 'Failed to load event')
        if (!awRes.ok) throw new Error(awData.message || 'Failed to load awards')
        setEvent(evData.event)
        setAwards(Array.isArray(awData.awards) ? awData.awards : [])
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    load()
  }, [eventId])

  const heroAward    = awards.find(a => a.id === awardId) || awards[0] || null
  const heroNominees = Array.isArray(heroAward?.nominees) ? heroAward.nominees : []
  const activeKey    = heroAward?.id || awardId || eventId

  const resolvedNominee = resolveNomineeName(heroAward, nomineeSlug)
    || resolveNomineeName(heroAward, heroNominees[0])
    || ''

  const currentNominee = selected[activeKey] || resolvedNominee
  const quantity = Math.max(1, Number(quantities[activeKey] || 1))
  const subtotal = quantity * 50
  const transactionFee = estimateFee(subtotal)
  const totalAmount = subtotal + transactionFee
  const totalVotes = awards.reduce((t, a) => t + Number(a.voteCount || 0), 0)

  function handlePosterFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setPosterUrl(url)
  }

  async function handleVote() {
    setVoteMsg(''); setError('')
    if (!form.email)     { setVoteMsg('Enter your email before voting.'); return }
    if (!currentNominee) { setVoteMsg('Select a nominee before voting.'); return }
    if (!paystackKey)    { setVoteMsg('Paystack key is missing.'); return }
    if (!window.PaystackPop) { setVoteMsg('Paystack is still loading. Try again.'); return }

    const amount = subtotal * 100
    setVotingId(activeKey)
    try {
      const ref = `${activeKey}-${slugify(currentNominee)}-${Date.now()}`
      const handler = window.PaystackPop.setup({
        key:      paystackKey,
        email:    form.email,
        amount,
        currency: 'NGN',
        channels: ['card', 'bank_transfer', 'ussd', 'bank'],
        ref,
        metadata: {
          platform:     'eventsphere',
          payment_type: 'vote',
          eventId, awardId: activeKey, quantity,
          name: form.name, email: form.email, nominee: currentNominee,
          custom_fields: [
            { display_name: 'Platform',    variable_name: 'platform',    value: 'EventSphere' },
            { display_name: 'Payment Type',variable_name: 'payment_type',value: 'Vote' },
            { display_name: 'Award',       variable_name: 'award_title', value: heroAward?.title || '' },
            { display_name: 'Voting For',  variable_name: 'nominee',     value: currentNominee },
            { display_name: 'Votes',       variable_name: 'quantity',    value: String(quantity) },
            { display_name: 'Voter',       variable_name: 'voter_name',  value: form.name || form.email },
          ],
        },
        callback: response => {
          void verifyVotePayment({
            eventId, awardId: activeKey, voteReference: ref,
            quantity, name: form.name, email: form.email, nominee: currentNominee,
            setAwards, setVoteMessage: setVoteMsg,
            navigate,
            apiBase: API_BASE,
            backUrl: `/public/events/${eventId}/voting/${activeKey}`,
          }, response)
        },
        onClose: () => setVoteMsg('Checkout closed before payment was completed.'),
      })
      handler.openIframe()
    } catch (err) { setVoteMsg(err.message) }
    finally { setVotingId('') }
  }

  if (loading) return <Shell msg="Loading voting page…" />
  if (error && !event) return <Shell msg={error} label="Back" onAction={() => navigate('/events')} />
  if (!event) return <Shell msg="Event not found" label="Back" onAction={() => navigate('/events')} />

  return (
    <div style={S.page}>
      {/* ── TOPBAR ── */}
      <header style={S.topbar}>
        <div style={S.brand}>
          <div style={S.brandMark}>✦</div>
          <span style={S.brandText}>EventsNest</span>
        </div>
        <div style={S.secureTag}>
          <span style={S.secureDot} />
          {!isMobile && 'Secure Voting'}
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section style={{ ...S.hero, padding: isMobile ? '32px 16px 48px' : '44px 28px 56px' }}>
        <div style={S.heroChip}>{heroAward?.title || 'Award Category'}</div>
        <h1 style={S.heroTitle}>
          Vote for <span style={S.heroHighlight}>{formatDisplay(currentNominee) || 'your favourite'}</span>
        </h1>
        <p style={S.heroSub}>{event.title}</p>
        <div style={S.heroPills}>
          {[
            formatDisplay(currentNominee) || 'Select nominee',
            heroAward?.title || 'Category',
            '₦50 per vote',
            `${totalVotes.toLocaleString()} total votes`,
          ].map(t => <span key={t} style={S.heroPill}>{t}</span>)}
        </div>
      </section>

      {/* ── BODY ── */}
      <main style={{ 
        ...S.body, 
        gridTemplateColumns: isTablet ? '1fr' : '1fr 360px',
        margin: isMobile ? '0 auto' : '-24px auto 0',
        padding: isMobile ? '16px 16px 60px' : '0 24px 80px'
      }}>

        {/* ══ LEFT ══ */}
        <div style={S.left}>

          {/* poster + vote count */}
          <div style={{ ...S.posterRow, flexDirection: isMobile ? 'column' : 'row' }}>

            {/* ── POSTER IMAGE INPUT ── */}
            <div
              style={{
                ...S.posterWrap,
                width: isMobile ? '100%' : 180,
                height: isMobile ? 220 : 180,
                border: posterDrag
                  ? '2px dashed #a78bfa'
                  : posterUrl ? '2px solid rgba(255,255,255,0.1)' : '2px dashed rgba(255,255,255,0.18)',
              }}
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setPosterDrag(true) }}
              onDragLeave={() => setPosterDrag(false)}
              onDrop={e => {
                e.preventDefault(); setPosterDrag(false)
                handlePosterFile(e.dataTransfer.files[0])
              }}
            >
              {posterUrl
                ? <img src={posterUrl} alt="Event poster" style={S.posterImg} />
                : (event.coverImage
                    ? <img src={event.coverImage} alt={event.title} style={S.posterImg} />
                    : <div style={S.posterPlaceholder}>
                        <div style={S.posterIcon}>🖼</div>
                        <div style={S.posterHint}>Click or drag to<br/>add poster image</div>
                      </div>
                  )
              }
              {/* always-visible edit badge */}
              <div style={S.posterBadge}>
                <span>📷</span>
                <span>{posterUrl ? 'Change' : 'Add photo'}</span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handlePosterFile(e.target.files[0])}
              />
            </div>

            {/* vote count card */}
            <div style={S.votesCard}>
              <div style={S.votesNum}>{totalVotes.toLocaleString()}</div>
              <div style={S.votesLbl}>Total Votes</div>
              <div style={S.votesDivider} />
              <div style={S.votesNum2}>{quantity}</div>
              <div style={S.votesLbl}>Your selection</div>
            </div>
          </div>

          {/* info grid */}
          <div style={{ ...S.infoGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
            <InfoBox title="Event Details">
              <Meta label="Event"  value={event.title} />
              <Meta label="Date"   value={formatDateLong(event.startDate)} />
              <Meta label="Time"   value={formatTimeRange(event.startTime, event.endTime)} />
              <Meta label="Venue"  value={event.location || 'To be announced'} />
            </InfoBox>
            <InfoBox title="Award Category">
              <Meta label="Award"     value={heroAward?.title || '—'} />
              <Meta label="Nominee"   value={formatDisplay(currentNominee) || 'Select below'} />
              <Meta label="Category"  value={heroAward?.description || '—'} />
              <Meta label="Per vote"  value="₦50" />
            </InfoBox>
          </div>

          {/* nominee selector */}
          <div style={S.nomineeBox}>
            <div style={S.boxTitle}>Choose a Nominee</div>
            {heroNominees.length === 0
              ? <p style={{ color:'#5a5a6a', fontSize:14 }}>No nominees added yet.</p>
              : <div style={S.nomineeGrid}>
                  {heroNominees.map(n => {
                    const name   = n?.name || n
                    const active = formatDisplay(currentNominee) === formatDisplay(name)
                    return (
                      <button
                        key={name}
                        style={{ ...S.nomineePill, ...(active ? S.nomineePillOn : {}) }}
                        onClick={() => {
                          setSelected(p => ({ ...p, [activeKey]: name }))
                          navigate(`/public/events/${eventId}/voting/${heroAward?.id}/${slugify(name)}`)
                        }}
                        disabled={votingId === activeKey}
                      >
                        {active && <span style={S.nomineeCheck}>✓</span>}
                        {formatDisplay(name)}
                      </button>
                    )
                  })}
                </div>
            }
          </div>

          {/* all awards list */}
          {awards.length > 1 && (
            <div style={S.allAwardsBox}>
              <div style={S.boxTitle}>All Award Categories</div>
              <div style={S.awardList}>
                {awards.map(a => (
                  <button
                    key={a.id}
                    style={{ ...S.awardItem, ...(a.id === heroAward?.id ? S.awardItemOn : {}) }}
                    onClick={() => navigate(`/public/events/${eventId}/voting/${a.id}`)}
                  >
                    <div>
                      <div style={S.awardItemTitle}>{a.title}</div>
                      <div style={S.awardItemSub}>{a.voteCount || 0} votes · {Array.isArray(a.nominees) ? a.nominees.length : 0} nominees</div>
                    </div>
                    <span style={S.awardItemArrow}>›</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══ VOTE CARD ══ */}
        <aside style={{ ...S.voteCard, position: isTablet ? 'static' : 'sticky' }}>
          <div style={S.voteCardTop}>
            <div style={S.voteHeart}>♥</div>
            <h2 style={S.voteTitle}>Cast Your Vote</h2>
            <p style={S.voteSub}>
              Support <strong style={{ color:'#c4b5fd' }}>{formatDisplay(currentNominee) || 'your nominee'}</strong> with a secure Paystack payment.
            </p>
          </div>

          {voteMsg && (
            <div style={{
              ...S.banner,
              background: voteMsg.startsWith('✓') ? 'rgba(74,222,128,0.12)' : 'rgba(167,139,250,0.12)',
              borderColor: voteMsg.startsWith('✓') ? 'rgba(74,222,128,0.3)' : 'rgba(167,139,250,0.3)',
              color: voteMsg.startsWith('✓') ? '#4ade80' : '#ddd6fe',
            }}>
              {voteMsg}
            </div>
          )}

          <div style={S.formFields}>
            <Field label="Email Address">
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                style={S.input}
                required
              />
            </Field>

            <Field label="Your Name">
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Auto-filled from email"
                style={S.input}
              />
            </Field>

            <Field label="Number of Votes">
              <div style={S.quantityRow}>
                <button
                  style={S.qBtn}
                  onClick={() => setQuantities(p => ({ ...p, [activeKey]: Math.max(1, quantity - 1) }))}
                >−</button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantities(p => ({ ...p, [activeKey]: Math.max(1, Number(e.target.value || 1)) }))}
                  style={{ ...S.input, textAlign:'center', flex:1 }}
                />
                <button
                  style={S.qBtn}
                  onClick={() => setQuantities(p => ({ ...p, [activeKey]: quantity + 1 }))}
                >+</button>
              </div>
            </Field>

            {/* ══ DYNAMIC PAYMENT BREAKDOWN MOVED HERE ══ */}
            <div style={S.breakdownCard}>
              <div style={S.breakdownHead}>
                <span style={S.breakdownIcon}>📊</span>
                <span>Payment Breakdown</span>
              </div>
              <div style={S.breakdownRow}>
                <span>Contestant:</span>
                <strong>{formatDisplay(currentNominee) || 'Select nominee'}</strong>
              </div>
              <div style={S.breakdownRow}>
                <span>Category:</span>
                <strong>{heroAward?.title || '—'}</strong>
              </div>
              <div style={S.breakdownRow}>
                <span>Price per Vote:</span>
                <strong>{formatMoney(50)}</strong>
              </div>
              <div style={S.breakdownRow}>
                <span>Number of Votes:</span>
                <strong>{quantity}</strong>
              </div>
              <div style={S.breakdownRow}>
                <span>Subtotal:</span>
                <strong>{formatMoney(subtotal)}</strong>
              </div>
              <div style={S.breakdownRow}>
                <span>Transaction Fees:</span>
                <strong>{formatMoney(transactionFee)}</strong>
              </div>
            </div>

            {/* total */}
            <div style={S.totalRow}>
              <span style={S.totalLabel}>Total Amount</span>
              <span style={S.totalAmount}>{formatMoney(totalAmount)}</span>
            </div>

            <button
              style={{
                ...S.voteBtn,
                opacity: votingId === activeKey ? 0.6 : 1,
                cursor:  votingId === activeKey ? 'not-allowed' : 'pointer',
              }}
              onClick={handleVote}
              disabled={votingId === activeKey}
            >
              {votingId === activeKey ? 'Opening Paystack…' : `Vote for ${formatDisplay(currentNominee) || 'Nominee'} →`}
            </button>

            <div style={S.secureRow}>
              <span style={S.secureDot} />
              <span style={S.secureText}>Secured by Paystack · One-time payment</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

/* ── tiny sub-components ── */
function Shell({ msg, label, onAction }) {
  return (
    <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'#0e0e14', color:'#e8e8f0', fontFamily:"'DM Sans',system-ui,sans-serif", padding: 16 }}>
      <div style={{ padding:32, borderRadius:20, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', textAlign:'center', width:'100%', maxWidth:400, boxSizing:'border-box' }}>
        <p style={{ fontSize:16, marginBottom:16, color:'#9a9aaa' }}>{msg}</p>
        {onAction && <button onClick={onAction} style={{ background:'rgba(255,255,255,0.08)', color:'#e8e8f0', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 20px', cursor:'pointer', fontFamily:"'DM Sans',system-ui,sans-serif" }}>{label}</button>}
      </div>
    </div>
  )
}

function InfoBox({ title, children }) {
  return (
    <div style={S.infoBox}>
      <div style={S.boxTitle}>{title}</div>
      {children}
    </div>
  )
}

// Fixed minor bug where labels inside labels were causing nested activation problems
function Meta({ label, value }) {
  return (
    <div style={S.metaRow}>
      <span style={S.metaLabel}>{label}</span>
      <span style={S.metaValue}>{value}</span>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={S.field}>
      <span style={S.fieldLabel}>{label}</span>
      {children}
    </div>
  )
}

/* ══════════════════════════════════════
   STYLES
══════════════════════════════════════ */
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0e0a1a 0%, #0e0e14 40%, #0b0b10 100%)',
    color: '#e8e8f0',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },

  /* topbar */
  topbar: {
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    background: 'rgba(14,10,26,0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand:     { display:'flex', alignItems:'center', gap:10 },
  brandMark: { width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#a78bfa)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14 },
  brandText: { fontSize:16, fontWeight:700, letterSpacing:'-.3px' },
  secureTag: { display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:600, color:'#6b6b7a' },
  secureDot: { width:7, height:7, borderRadius:'50%', background:'#4ade80', flexShrink:0 },

  /* hero */
  hero: {
    background: 'linear-gradient(110deg, #4c1d95 0%, #5b21b6 45%, #6d28d9 100%)',
    textAlign: 'center',
  },
  heroChip:      { display:'inline-block', background:'rgba(255,255,255,0.15)', borderRadius:999, padding:'6px 16px', fontSize:12.5, fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase', marginBottom:16, color:'#e9d5ff' },
  heroTitle:     { fontSize:'clamp(24px, 5vw, 42px)', fontWeight:900, letterSpacing:'-1px', lineHeight:1.1, margin:'0 0 10px', color:'#fff' },
  heroHighlight: { color:'#c4b5fd' },
  heroSub:       { fontSize:15, color:'rgba(255,255,255,0.7)', marginBottom:24, padding: '0 16px' },
  heroPills:     { display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap', padding: '0 12px' },
  heroPill:      { background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:999, padding:'6px 12px', fontSize:12, fontWeight:600, color:'#e9d5ff' },

  /* body layout */
  body: {
    maxWidth: 1160,
    display: 'grid',
    gap: 20,
    alignItems: 'start',
    boxSizing: 'border-box',
  },
  left: { display:'flex', flexDirection:'column', gap:16, width: '100%', boxSizing: 'border-box' },

  /* poster */
  posterRow: { display:'flex', gap:16, alignItems:'stretch' },
  posterWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    background: '#1a1a24',
    flexShrink: 0,
    transition: 'border-color .2s',
  },
  posterImg: { width:'100%', height:'100%', objectFit:'cover', display:'block' },
  posterPlaceholder: { width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 },
  posterIcon: { fontSize:32, opacity:.4 },
  posterHint: { fontSize:12, color:'#5a5a6a', textAlign:'center', lineHeight:1.5 },
  posterBadge: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    borderRadius: 999,
    padding: '5px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11.5,
    fontWeight: 700,
    color: '#c4b5fd',
    whiteSpace: 'nowrap',
    border: '1px solid rgba(167,139,250,0.3)',
  },

  /* votes card */
  votesCard: {
    flex: 1,
    background: '#1a1a24',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: 4,
    minHeight: 180,
    boxSizing: 'border-box',
  },
  votesNum:    { fontSize: 36, fontWeight: 900, letterSpacing: '-1px', color: '#c4b5fd', lineHeight: 1 },
  votesLbl:    { fontSize: 11, color: '#5a5a6a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' },
  votesDivider:{ width: 32, height: 1, background: 'rgba(255,255,255,0.07)', margin: '10px 0' },
  votesNum2:   { fontSize: 24, fontWeight: 800, letterSpacing: '-1px', color: '#a78bfa', lineHeight: 1 },

  /* info */
  infoGrid: { display:'grid', gap:12 },
  infoBox: { background:'#1a1a24', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'18px 20px', boxSizing: 'border-box' },
  boxTitle: { fontSize:14, fontWeight:800, color:'#e8e8f0', marginBottom:12, letterSpacing:'-.2px' },
  metaRow:  { display:'flex', flexDirection:'column', marginBottom:8 },
  metaLabel:{ fontSize:10.5, fontWeight:700, color:'#5a5a6a', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:2 },
  metaValue:{ fontSize:13.5, color:'#b0b0be', fontWeight:500, lineHeight:1.4 },

  /* nominee */
  nomineeBox: { background:'#1a1a24', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'18px 20px', boxSizing: 'border-box' },
  nomineeGrid:{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 },
  nomineePill:{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#9a9aaa', borderRadius:999, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', gap:6, fontFamily:"'DM Sans',system-ui,sans-serif" },
  nomineePillOn:{ background:'rgba(167,139,250,0.15)', borderColor:'rgba(167,139,250,0.4)', color:'#e9d5ff' },
  nomineeCheck: { color:'#a78bfa', fontWeight:900, fontSize:12 },

  /* awards list */
  allAwardsBox: { background:'#1a1a24', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'18px 20px', boxSizing: 'border-box' },
  awardList:  { display:'flex', flexDirection:'column', gap:8, marginTop:4 },
  awardItem:  { display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 16px', cursor:'pointer', transition:'background .15s', fontFamily:"'DM Sans',system-ui,sans-serif", textAlign:'left' },
  awardItemOn:{ background:'rgba(167,139,250,0.10)', borderColor:'rgba(167,139,250,0.3)' },
  awardItemTitle:{ fontSize:14, fontWeight:700, color:'#e8e8f0', marginBottom:2 },
  awardItemSub:  { fontSize:12, color:'#5a5a6a' },
  awardItemArrow:{ fontSize:18, color:'#5a5a6a' },

  /* vote card container */
  voteCard: {
    background: '#1a1a24',
    border: '1px solid rgba(167,139,250,0.2)',
    borderRadius: 20,
    overflow: 'hidden',
    top: 80,
    boxShadow: '0 8px 40px rgba(124,58,237,0.15)',
    width: '100%',
    boxSizing: 'border-box',
  },
  voteCardTop: { background:'linear-gradient(135deg,#2e1065,#1e1030)', padding:'28px 24px 20px', textAlign:'center', borderBottom:'1px solid rgba(167,139,250,0.15)' },
  voteHeart:  { fontSize:28, marginBottom:10 },
  voteTitle:  { fontSize:22, fontWeight:800, letterSpacing:'-.5px', color:'#f0f0f4', margin:'0 0 8px' },
  voteSub:    { fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.55, margin:0 },

  banner: { margin:'16px 24px 0', padding:'11px 14px', borderRadius:12, border:'1px solid', fontSize:13, fontWeight:600, lineHeight:1.5 },
  formFields: { padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:0 },
  field:      { display:'flex', flexDirection:'column', gap:5, marginBottom:14 },
  fieldLabel: { fontSize:11.5, fontWeight:700, color:'#5a5a6a', textTransform:'uppercase', letterSpacing:'.5px' },
  
  input: {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 14,
    color: '#e8e8f0',
    outline: 'none',
    fontFamily: "'DM Sans',system-ui,sans-serif",
    transition: 'border-color .15s',
  },

  quantityRow: { display:'flex', alignItems:'center', gap:8 },
  qBtn: { width:40, height:40, borderRadius:10, background:'rgba(167,139,250,0.12)', border:'1px solid rgba(167,139,250,0.2)', color:'#c4b5fd', fontSize:20, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:"'DM Sans',system-ui,sans-serif" },

  /* payment breakdown table styling */
  breakdownCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: '14px 16px',
    marginTop: 6,
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  breakdownHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    fontWeight: 700,
    color: '#a78bfa',
    textTransform: 'uppercase',
    letterSpacing: '.3px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: 8,
  },
  breakdownIcon: { fontSize: 14 },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    color: '#9a9aaa',
  },

  totalRow:   { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderTop:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:16 },
  totalLabel: { fontSize:12, fontWeight:700, color:'#5a5a6a', textTransform:'uppercase', letterSpacing:'.5px' },
  totalAmount:{ fontSize:22, fontWeight:900, letterSpacing:'-1px', color:'#c4b5fd' },

  voteBtn: {
    width: '100%',
    background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '14px 0',
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: '-.2px',
    cursor: 'pointer',
    marginBottom: 14,
    fontFamily: "'DM Sans',system-ui,sans-serif",
    boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
    transition: 'opacity .15s, transform .15s',
  },

  secureRow: { display:'flex', alignItems:'center', justifyContent:'center', gap:7 },
  secureText:{ fontSize:12, color:'#5a5a6a', fontWeight:500 },
}