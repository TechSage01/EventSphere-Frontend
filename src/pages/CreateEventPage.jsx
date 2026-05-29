import { useState, useEffect, useRef } from 'react'
import { getApiBaseUrl } from '../services/api'
import { useNavigate } from 'react-router-dom'

/* ── tiny helpers ── */
function today() {
  return new Date().toISOString().slice(0, 10)
}
function todayPlus1h() {
  const d = new Date(); d.setHours(d.getHours() + 1)
  return `${String(d.getHours()).padStart(2,'0')}:00`
}
function nowHour() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:00`
}

const THEMES = [
  { id: 'minimal',   label: 'Minimal',   bg: ['#0d2b2b','#0a1f2e'],  accent: '#5eead4' },
  { id: 'aurora',    label: 'Aurora',    bg: ['#1a0533','#0d1f3c'],  accent: '#a78bfa' },
  { id: 'sunrise',   label: 'Sunrise',   bg: ['#2d1a0e','#1f0d1a'],  accent: '#fb923c' },
  { id: 'ocean',     label: 'Ocean',     bg: ['#0a1628','#061a2e'],  accent: '#38bdf8' },
  { id: 'forest',    label: 'Forest',    bg: ['#0d2110','#0a1a0d'],  accent: '#4ade80' },
  { id: 'rose',      label: 'Rose',      bg: ['#2d0a1a','#1a0a1a'],  accent: '#fb7185' },
  { id: 'black',     label: 'Black',     bg: ['#000000','#060606'],  accent: '#ffffff' },
]

export default function CreateEventPage() {
  const navigate = useNavigate()
  const API_BASE = getApiBaseUrl()
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth))

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // close category menu on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!categoryRef.current) return
      if (!categoryRef.current.contains(e.target)) setCategoryOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  // Order fixed: Narrowest conditions must be checked first
  const responsive = viewportWidth <= 480 ? mobileStyles : viewportWidth <= 768 ? tabletStyles : null
  const isMiniMobile = viewportWidth <= 360

  /* form state */
  const [name,         setName]        = useState('')
  const [startDate,   setStartDate]   = useState(today())
  const [startTime,   setStartTime]   = useState(nowHour())
  const [endDate,     setEndDate]     = useState(today())
  const [endTime,     setEndTime]     = useState(todayPlus1h())
  const [location,     setLocation]    = useState('')
  const [description, setDescription] = useState('')
  const [isPublic,     setIsPublic]    = useState(true)
  const [ticketPrice, setTicketPrice] = useState('Free')
  const [ticketVipPrice, setTicketVipPrice] = useState('')
  const [ticketTablePrice, setTicketTablePrice] = useState('')
  const [ticketVipError, setTicketVipError] = useState('')
  const [ticketTableError, setTicketTableError] = useState('')
  const [requireApproval, setRequireApproval] = useState(false)
  const [capacity,     setCapacity]    = useState('Unlimited')
  const [themeIdx,     setThemeIdx]    = useState(0)
  const [editingPrice, setEditingPrice] = useState(false)
  const [editingCap,   setEditingCap]   = useState(false)
  const [submitting,   setSubmitting]  = useState(false)
  const [coverFile,   setCoverFile]   = useState(null)
  const [coverUrl,     setCoverUrl]    = useState(null)
  const [coverImageData, setCoverImageData] = useState('')
  const [category, setCategory] = useState('Featured')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const categoryRef = useRef()
  const fileRef = useRef()

  const theme = THEMES[themeIdx]

  /* cycle theme on shuffle */
  function shuffleTheme() {
    setThemeIdx(i => (i + 1) % THEMES.length)
  }
  function prevTheme() {
    setThemeIdx(i => (i - 1 + THEMES.length) % THEMES.length)
  }

  /* cover image */
  function onFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setCoverFile(f)
    const previewUrl = URL.createObjectURL(f)
    setCoverUrl(previewUrl)

    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const maxSize = 1280
        const scale = Math.min(1, maxSize / Math.max(image.width || maxSize, image.height || maxSize))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round((image.width || maxSize) * scale))
        canvas.height = Math.max(1, Math.round((image.height || maxSize) * scale))

        const context = canvas.getContext('2d')
        if (!context) {
          setCoverImageData(String(reader.result || ''))
          return
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        setCoverImageData(canvas.toDataURL('image/jpeg', 0.78))
      }
      image.onerror = () => {
        setCoverImageData(String(reader.result || ''))
      }
      image.src = String(reader.result || '')
    }
    reader.readAsDataURL(f)
  }

    function formatPriceInput(val) {
      const cleaned = String(val || '').replace(/[^0-9.]/g, '').trim()
      if (!cleaned) return ''
      const n = Math.round(Number(cleaned))
      return Number.isFinite(n) ? String(n) : ''
    }

  /* submit */
  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('es_token')
      const body = {
        name, title: name, startDate, startTime, endDate, endTime,
        location, description, isPublic, ticketPrice,
        requireApproval, capacity, // use selected category for discover filters
        theme: category || theme.id,
        ticketPrices: (() => {
          const tp = {}
          const vip = parseFloat(String(ticketVipPrice || '').trim())
          const table = parseFloat(String(ticketTablePrice || '').trim())
          if (!Number.isNaN(vip) && vip > 0) tp.vip = vip
          if (!Number.isNaN(table) && table > 0) tp.table = table
          return Object.keys(tp).length ? tp : null
        })(),
        coverImage: coverImageData,
      }
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json') ? await res.json() : { message: await res.text() }
      if (!res.ok) {
        console.error('Create event failed', { status: res.status, statusText: res.statusText, data, headers: Object.fromEntries(res.headers) })
        // surface a clear message for debugging in the browser
        alert(`Failed to create event: ${res.status} ${res.statusText}\n${data?.message || JSON.stringify(data)}`)
        throw new Error(data.message || `Failed to create event: ${res.status}`)
      }

      const createdEvent = data.event || data.data?.event || data.data || data
      if (!createdEvent?.id) {
        throw new Error('Event created, but the server response did not include an event id.')
      }

      navigate(`/events/${createdEvent.id}`)
    } catch (err) {
      console.error(err)
      try { alert(err.message || 'Failed to create event') } catch (e) {}
    } finally {
      setSubmitting(false)
    }
  }

  /* gradient bg string */
  const bgGrad = `linear-gradient(135deg, ${theme.bg[0]} 0%, ${theme.bg[1]} 100%)`

  return (
    <div style={{ ...S.shell, ...(responsive?.shell || {}), background: bgGrad }}>

      {/* ── TOPBAR ── */}
      <header style={{ ...S.topbar, ...(responsive?.topbar || {}) }}>
        <nav style={{ ...S.topLeft, ...(responsive?.topLeft || {}) }}>
          <span style={{ ...S.starLogo, color: theme.accent }}>✦</span>
          <a href="/events"    style={S.navLink}><span style={S.navIcon}>▦</span> {viewportWidth > 580 && 'Events'}</a>
          <a href="/calendars" style={{ ...S.navLink, color: '#5a7a7a' }}><span style={S.navIcon}>📅</span> {viewportWidth > 580 && 'Calendars'}</a>
          <a href="/discover"  style={{ ...S.navLink, color: '#5a7a7a' }}><span style={S.navIcon}>◎</span> {viewportWidth > 580 && 'Discover'}</a>
        </nav>
        <div style={{ ...S.topRight, ...(responsive?.topRight || {}) }}>
          {viewportWidth > 400 && (
            <span style={S.timeChip}>{new Intl.DateTimeFormat('en-NG',{hour:'2-digit',minute:'2-digit',timeZone:'Africa/Lagos',timeZoneName:'short'}).format(new Date())}</span>
          )}
          <button style={{ ...S.createBtn, background: theme.accent, color: '#0a0a0a', ...(responsive?.createBtn || {}) }}>
            {viewportWidth <= 480 ? 'Create' : 'Create Event'}
          </button>
          <div style={S.avatar}>🙂</div>
        </div>
      </header>

      {/* ── BODY ── */}
      <form onSubmit={handleSubmit} style={{ ...S.body, ...(responsive?.body || {}) }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ ...S.leftCol, ...(responsive?.leftCol || {}) }}>

          {/* cover image */}
          <div
            style={{
              ...S.coverBox,
              ...(responsive?.coverBox || {}),
              background: coverUrl
                ? `url(${coverUrl}) center/cover`
                : `linear-gradient(135deg, ${theme.accent}22 0%, ${theme.bg[1]} 100%)`,
              border: `1px solid ${theme.accent}30`,
            }}
            onClick={() => fileRef.current.click()}
          >
            {!coverUrl && (
              <div style={S.coverPlaceholder}>
                <svg width="140" height="140" viewBox="0 0 140 140" fill="none" style={{ opacity: .55, transform: viewportWidth <= 480 ? 'scale(0.8)' : 'none' }}>
                  <ellipse cx="70" cy="70" rx="40" ry="55" stroke={theme.accent} strokeWidth="2" fill="none"/>
                  <ellipse cx="70" cy="70" rx="55" ry="30" stroke={theme.accent} strokeWidth="1.5" fill="none" strokeDasharray="4 4"/>
                  <circle cx="70" cy="70" r="8" fill={theme.accent} opacity=".5"/>
                  <path d="M30 50 Q70 20 110 50" stroke={theme.accent} strokeWidth="1.5" fill="none" opacity=".5"/>
                  <path d="M30 90 Q70 120 110 90" stroke={theme.accent} strokeWidth="1.5" fill="none" opacity=".5"/>
                </svg>
              </div>
            )}
            <button
              type="button"
              style={{ ...S.cameraBtn, background: theme.accent }}
              onClick={e => { e.stopPropagation(); fileRef.current.click() }}
              aria-label="Upload cover image"
            >
              📷
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onFileChange}/>
          </div>

          {/* theme picker */}
          <div style={{ ...S.themeRow, ...(responsive?.themeRow || {}) }}>
            <div style={{ ...S.themePreview, background: `linear-gradient(135deg, ${theme.bg[0]}, ${theme.bg[1]})`, border: `1px solid ${theme.accent}40` }}>
              <div style={{ width:14, height:10, background: theme.accent, borderRadius:2, marginBottom:4, opacity:.8 }}/>
              <div style={{ width:20, height:3, background: '#fff', borderRadius:1, opacity:.3, marginBottom:2 }}/>
              <div style={{ width:14, height:3, background: '#fff', borderRadius:1, opacity:.2 }}/>
            </div>
            <div style={S.themeInfo}>
              <span style={{ fontSize:11, color:'#5a8a8a', display:'block', marginBottom:2 }}>Theme</span>
              <span style={{ fontSize:14, fontWeight:700, color:'#e0f0f0' }}>{theme.label}</span>
            </div>
            <button type="button" style={S.themeArrow} onClick={prevTheme}>‹</button>
            <button type="button" style={S.themeArrow} onClick={() => setThemeIdx(i=>(i+1)%THEMES.length)}>›</button>
            <button type="button" style={{ ...S.themeArrow, marginLeft:4 }} onClick={shuffleTheme} title="Random theme">⇄</button>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ ...S.rightCol, ...(responsive?.rightCol || {}) }}>

          {/* calendar + visibility row */}
          <div style={{ ...S.topMeta, ...(responsive?.topMeta || {}) }}>
            <button type="button" style={{ ...S.pill, border:`1px solid ${theme.accent}40`, ...(responsive?.pill || {}) }}>
              <span style={{ fontSize:16 }}>🙂</span>
              <span style={{ flex: 1, textAlign: 'left' }}>Personal Calendar</span>
              <span style={{ opacity:.5 }}>▾</span>
            </button>
            <button
              type="button"
              style={{ ...S.pill, border:`1px solid ${theme.accent}40`, ...(responsive?.pill || {}) }}
              onClick={() => setIsPublic(p => !p)}
            >
              <span>{isPublic ? '🌐' : '🔒'}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{isPublic ? 'Public' : 'Private'}</span>
              <span style={{ opacity:.5 }}>▾</span>
            </button>
            <div ref={categoryRef} style={{ position: 'relative', marginLeft: 4 }}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={categoryOpen}
                onClick={() => setCategoryOpen(v => !v)}
                style={S.categoryBtn}
              >
                <span style={{ fontWeight: 700 }}>{category}</span>
                <span style={{ opacity: 0.6, marginLeft: 8 }}>▾</span>
              </button>

              {categoryOpen && (
                <div role="menu" style={S.categoryMenu}>
                  {['Featured', 'Music', 'Business', 'Community', 'Workshops', 'Nightlife'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      role="menuitem"
                      onClick={() => { setCategory(opt); setCategoryOpen(false) }}
                      style={{ ...(S.categoryOption || {}), ...(category === opt ? S.categoryOptionActive : {}) }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* event name */}
          <input
            type="text"
            placeholder="Event Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{
              ...S.nameInput,
              ...(responsive?.nameInput || {}),
              caretColor: theme.accent,
            }}
          />

          {/* date/time block */}
          <div style={{ ...S.fieldBox, ...(responsive?.fieldBox || {}), border:`1px solid ${theme.accent}20` }}>
            {/* start */}
            <div style={{ ...S.timeRow, ...(responsive?.timeRow || {}) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 75 }}>
                <span style={S.timeDot}>●</span>
                <span style={S.timeLabel}>Start</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flex: 1, width: isMiniMobile ? '100%' : 'auto' }}>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{ ...S.dateInput, flex: 1, minWidth: 0 }}/>
                <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} style={{ ...S.timeInput, flex: isMiniMobile ? 'none' : 1, width: isMiniMobile ? '90px' : 'auto' }}/>
              </div>
            </div>
            <div style={S.timeSep}/>
            {/* end */}
            <div style={{ ...S.timeRow, ...(responsive?.timeRow || {}) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 75 }}>
                <span style={{ ...S.timeDot, opacity:.4 }}>○</span>
                <span style={S.timeLabel}>End</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flex: 1, width: isMiniMobile ? '100%' : 'auto' }}>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{ ...S.dateInput, flex: 1, minWidth: 0 }}/>
                <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} style={{ ...S.timeInput, flex: isMiniMobile ? 'none' : 1, width: isMiniMobile ? '90px' : 'auto' }}/>
              </div>
            </div>
            {/* timezone */}
            <div style={{ ...S.tzBox, borderTop:`1px solid ${theme.accent}15` }}>
              <span style={{ fontSize:14, opacity:.5 }}>🌐</span>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'#c0d8d8' }}>GMT+01:00</div>
                <div style={{ fontSize:11, color:'#5a8a8a' }}>Lagos</div>
              </div>
            </div>
          </div>

          {/* location */}
          <div style={{ ...S.fieldBox, ...(responsive?.fieldBox || {}), border:`1px solid ${theme.accent}20`, cursor:'text' }}
            onClick={() => document.getElementById('loc-input').focus()}>
            <div style={{ ...S.fieldRow, ...(responsive?.fieldRow || {}) }}>
              <span style={S.fieldIcon}>📍</span>
              <input
                id="loc-input"
                type="text"
                placeholder="Add Event Location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                style={{ ...S.fieldInlineInput, ...(responsive?.fieldInlineInput || {}) }}
              />
            </div>
            {!location && (
              <div style={{ paddingLeft: 36, paddingBottom: 12, fontSize:12, color:'#3d6a6a', marginTop: -4 }}>
                Offline location or virtual link
              </div>
            )}
          </div>

          {/* description */}
          <div style={{ ...S.fieldBox, ...(responsive?.fieldBox || {}), border:`1px solid ${theme.accent}20` }}>
            <div style={{ ...S.fieldRow, ...(responsive?.fieldRow || {}) }}>
              <span style={S.fieldIcon}>📝</span>
              <textarea
                placeholder="Add Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={{ ...S.textarea, ...(responsive?.textarea || {}) }}
              />
            </div>
          </div>

          {/* event options */}
          <div style={S.optionsBlock}>
            <p style={{ ...S.optionsTitle, ...(responsive?.optionsTitle || {}) }}>Event Options</p>

            <div style={{ ...S.optionBox, ...(responsive?.optionBox || {}), border:`1px solid ${theme.accent}18` }}>

              {/* ticket price */}
              <div style={{ ...S.optionRow, ...(responsive?.optionRow || {}) }}>
                <span style={S.optionIcon}>🎟</span>
                <span style={S.optionLabel}>Ticket Price</span>
                {editingPrice ? (
                  <input
                    autoFocus
                    type="text"
                    value={ticketPrice}
                    onChange={e => setTicketPrice(e.target.value)}
                    onBlur={() => setEditingPrice(false)}
                    style={S.optionInput}
                  />
                ) : (
                  <button type="button" style={S.optionValue} onClick={() => setEditingPrice(true)}>
                    {ticketPrice} ✎
                  </button>
                )}
              </div>

              {/* vip price */}
              <div style={{ ...S.optionRow, ...(responsive?.optionRow || {}) }}>
                <span style={S.optionIcon}>💎</span>
                <span style={S.optionLabel}>VIP Price (Naira)</span>
                <input type="text" inputMode="numeric" min="0" step="0.01" value={ticketVipPrice}
                  onChange={e => {
                    const v = e.target.value
                    setTicketVipPrice(v)
                    const cleaned = String(v || '').replace(/[^0-9.]/g, '').trim()
                    setTicketVipError(cleaned === '' || !isNaN(Number(cleaned)) ? '' : 'Enter a valid number')
                  }} onBlur={() => { setTicketVipPrice(formatPriceInput(ticketVipPrice)); setTicketVipError('') }} style={{ ...S.optionInput, width:120 }} placeholder="e.g. 5000" />
              </div>
              {ticketVipError && <div style={S.errorText}>{ticketVipError}</div>}

              {/* table for 4 price */}
              <div style={{ ...S.optionRow, ...(responsive?.optionRow || {}) }}>
                <span style={S.optionIcon}>🪑</span>
                <span style={S.optionLabel}>Table (4) Price (Naira)</span>
                <input type="text" inputMode="numeric" min="0" step="0.01" value={ticketTablePrice}
                  onChange={e => {
                    const v = e.target.value
                    setTicketTablePrice(v)
                    const cleaned = String(v || '').replace(/[^0-9.]/g, '').trim()
                    setTicketTableError(cleaned === '' || !isNaN(Number(cleaned)) ? '' : 'Enter a valid number')
                  }} onBlur={() => { setTicketTablePrice(formatPriceInput(ticketTablePrice)); setTicketTableError('') }} style={{ ...S.optionInput, width:120 }} placeholder="e.g. 20000" />
              </div>
              {ticketTableError && <div style={S.errorText}>{ticketTableError}</div>}

              <div style={{ ...S.optionDivider, ...(responsive?.optionDivider || {}), background:`${theme.accent}12` }}/>

              {/* require approval */}
              <div style={{ ...S.optionRow, ...(responsive?.optionRow || {}) }}>
                <span style={S.optionIcon}>👤</span>
                <span style={S.optionLabel}>Require Approval</span>
                <button
                  type="button"
                  style={{ ...S.toggle, background: requireApproval ? theme.accent : 'rgba(255,255,255,0.12)' }}
                  onClick={() => setRequireApproval(v => !v)}
                  aria-checked={requireApproval}
                  role="switch"
                >
                  <span style={{ ...S.toggleThumb, transform: requireApproval ? 'translateX(18px)' : 'translateX(0)' }}/>
                </button>
              </div>

              <div style={{ ...S.optionDivider, ...(responsive?.optionDivider || {}), background:`${theme.accent}12` }}/>

              {/* capacity */}
              <div style={{ ...S.optionRow, ...(responsive?.optionRow || {}) }}>
                <span style={S.optionIcon}>👥</span>
                <span style={S.optionLabel}>Capacity</span>
                {editingCap ? (
                  <input
                    autoFocus
                    type="text"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    onBlur={() => setEditingCap(false)}
                    style={S.optionInput}
                  />
                ) : (
                  <button type="button" style={S.optionValue} onClick={() => setEditingCap(true)}>
                    {capacity} ✎
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* submit */}
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            style={{
              ...S.submitBtn,
              ...(responsive?.submitBtn || {}),
              opacity: (!name.trim() || submitting) ? 0.5 : 1,
              cursor:  (!name.trim() || submitting) ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Creating…' : 'Create Event'}
          </button>

        </div>
      </form>
    </div>
  )
}

/* ══════════════════════════════════
    STYLES
══════════════════════════════════ */
const S = {
  shell: {
    minHeight: '100vh',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    WebkitFontSmoothing: 'antialiased',
    transition: 'background 0.8s ease',
    color: '#e0f0f0',
  },

  /* topbar */
  topbar: {
    position: 'sticky', top: 0, zIndex: 100,
    height: 52,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px',
    background: 'rgba(0,0,0,0.25)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  topLeft:  { display:'flex', alignItems:'center', gap:4 },
  topRight: { display:'flex', alignItems:'center', gap:10 },
  starLogo: { fontSize:18, marginRight:16, cursor:'pointer' },
  navLink:  { display:'flex', alignItems:'center', gap:5, fontSize:13.5, fontWeight:500, color:'#c0d8d8', textDecoration:'none', padding:'5px 10px', borderRadius:8 },
  navIcon:  { fontSize:12, opacity:.7 },
  timeChip: { fontSize:12, color:'#5a8a8a', fontVariantNumeric:'tabular-nums' },
  createBtn:{ fontSize:12.5, fontWeight:700, border:'none', padding:'7px 16px', borderRadius:999, cursor:'pointer', fontFamily:"'DM Sans',system-ui,sans-serif" },
  avatar:   { width:30, height:30, borderRadius:'50%', background:'#f5c842', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, cursor:'pointer' },

  /* layout */
  body: {
    display: 'grid',
    gridTemplateColumns: '420px 1fr',
    gap: 40,
    maxWidth: 1100,
    margin: '0 auto',
    padding: '40px 28px 80px',
    alignItems: 'start',
    boxSizing: 'border-box'
  },

  /* left col */
  leftCol: { display:'flex', flexDirection:'column', gap:16, position:'sticky', top:72 },

  coverBox: {
    width: '100%',
    aspectRatio: '4/3',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.8s ease',
  },
  coverPlaceholder: { display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%' },
  cameraBtn: {
    position: 'absolute', bottom:12, right:12,
    width:36, height:36, borderRadius:'50%',
    border:'none', cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:16, boxShadow:'0 2px 8px rgba(0,0,0,.4)',
    transition:'background 0.8s ease',
  },

  themeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: '12px 14px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  themePreview: {
    width: 48, height: 36,
    borderRadius: 8,
    padding: '6px 8px',
    flexShrink: 0,
    transition: 'background 0.8s ease',
  },
  themeInfo: { flex:1 },
  themeArrow: {
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    color: '#c0d8d8',
    width: 28, height: 28,
    borderRadius: 7,
    cursor: 'pointer',
    fontSize: 16,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:"'DM Sans',system-ui,sans-serif",
  },

  /* right col */
  rightCol: { display:'flex', flexDirection:'column', gap:14 },

  topMeta: { display:'flex', gap:10, flexWrap:'wrap' },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 999,
    padding: '7px 14px',
    fontSize: 13.5,
    fontWeight: 600,
    color: '#c0d8d8',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    fontFamily:"'DM Sans',system-ui,sans-serif",
    transition: 'border-color 0.8s ease',
    boxSizing: 'border-box'
  },
  categoryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', borderRadius: 10,
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    color: '#e8e8ec', cursor: 'pointer', fontWeight: 700,
  },
  categoryMenu: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    background: 'rgba(10,10,10,0.98)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10, padding: 6, minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 40
  },
  categoryOption: {
    display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px',
    background: 'transparent', border: 'none', color: '#c0d8d8', cursor: 'pointer', borderRadius: 6,
  },
  categoryOptionActive: {
    background: 'rgba(232,200,122,0.08)', color: '#f5e9c8', fontWeight: 800
  },

  nameInput: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: 'clamp(28px, 4vw, 44px)',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.25)',
    fontFamily:"'DM Sans',system-ui,sans-serif",
    letterSpacing: '-1px',
    padding: '8px 0',
    boxSizing: 'border-box',
  },

  fieldBox: {
    background: 'rgba(0,0,0,0.22)',
    borderRadius: 14,
    overflow: 'hidden',
    backdropFilter: 'blur(8px)',
    transition: 'border-color 0.8s ease',
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 16px',
  },
  fieldIcon: { fontSize:18, flexShrink:0, marginTop:1 },
  fieldInlineInput: {
    flex:1, background:'transparent', border:'none', outline:'none',
    fontSize:15, fontWeight:500, color:'#c0d8d8',
    fontFamily:"'DM Sans',system-ui,sans-serif",
    width: '100%'
  },
  textarea: {
    flex:1, background:'transparent', border:'none', outline:'none',
    fontSize:14, color:'#c0d8d8', resize:'none',
    fontFamily:"'DM Sans',system-ui,sans-serif",
    lineHeight:1.6,
  },

  /* date/time */
  timeRow: { display:'flex', alignItems:'center', gap:10, padding:'14px 16px', flexWrap: 'wrap' },
  timeSep: { height:1, background:'rgba(255,255,255,0.05)', margin:'0 16px' },
  timeDot: { fontSize:10, color:'#5a8a8a', flexShrink:0, width:12 },
  timeLabel: { fontSize:14, fontWeight:600, color:'#7aacac', width:32, flexShrink:0 },
  dateInput: {
    background:'rgba(255,255,255,0.07)', border:'none', outline:'none',
    borderRadius:8, padding:'6px 10px', fontSize:13, fontWeight:600,
    color:'#c0d8d8', cursor:'pointer',
    fontFamily:"'DM Sans',system-ui,sans-serif",
    colorScheme:'dark',
  },
  timeInput: {
    background:'rgba(255,255,255,0.07)', border:'none', outline:'none',
    borderRadius:8, padding:'6px 10px', fontSize:13, fontWeight:600,
    color:'#c0d8d8', cursor:'pointer',
    fontFamily:"'DM Sans',system-ui,sans-serif",
    colorScheme:'dark',
  },
  tzBox: {
    display:'flex', alignItems:'center', gap:10,
    padding:'10px 16px',
    margin:'0 0 0 0',
  },

  /* options */
  optionsBlock: { marginTop:4 },
  optionsTitle: { fontSize:13, fontWeight:700, color:'#7aacac', marginBottom:10, textTransform:'uppercase', letterSpacing:'.5px' },
  optionBox: {
    background: 'rgba(0,0,0,0.22)',
    borderRadius: 14,
    backdropFilter: 'blur(8px)',
    overflow:'hidden',
    transition: 'border-color 0.8s ease',
  },
  optionRow: { display:'flex', alignItems:'center', gap:12, padding:'14px 18px', justifyContent: 'space-between' },
  optionDivider: { height:1, margin:'0 18px' },
  optionIcon:  { fontSize:16, flexShrink:0 },
  optionLabel: { flex:1, fontSize:14, fontWeight:500, color:'#c0d8d8' },
  optionValue: {
    background:'none', border:'none', cursor:'pointer',
    fontSize:13, color:'#7aacac', fontWeight:600,
    fontFamily:"'DM Sans',system-ui,sans-serif",
  },
  optionInput: {
    background:'rgba(255,255,255,0.08)', border:'none', outline:'none',
    borderRadius:8, padding:'4px 8px', fontSize:13, color:'#e0f0f0',
    fontFamily:"'DM Sans',system-ui,sans-serif", width:90, textAlign:'right',
  },
  errorText: { color: '#fb7185', marginTop: 6, fontSize: 13, fontWeight: 700 },

  /* toggle */
  toggle: {
    width:38, height:20, borderRadius:999,
    border:'none', cursor:'pointer',
    position:'relative', flexShrink:0,
    transition:'background 0.2s',
    padding:0,
  },
  toggleThumb: {
    position:'absolute', top:2, left:2,
    width:16, height:16, borderRadius:'50%',
    background:'#fff',
    display:'block',
    transition:'transform 0.2s',
    boxShadow:'0 1px 4px rgba(0,0,0,.3)',
  },

  /* submit */
  submitBtn: {
    width:'100%', marginTop:8,
    background:'#fff', color:'#0a0a0a',
    border:'none', borderRadius:14,
    padding:'16px 0', fontSize:16, fontWeight:700,
    cursor:'pointer',
    fontFamily:"'DM Sans',system-ui,sans-serif",
    letterSpacing:'-.2px',
    boxShadow:'0 4px 24px rgba(0,0,0,.3)',
    transition:'opacity 0.2s',
  },
}

/* ── TABLET BREAKPOINT (768px down to 481px) ── */
const tabletStyles = {
  shell: { paddingBottom: 28 },
  topbar: { padding: '0 18px' },
  body: {
    gridTemplateColumns: '1fr',
    gap: 24,
    padding: '28px 18px 64px',
  },
  leftCol: { position: 'static', top: 'auto' },
  rightCol: { gap: 12 },
  themeRow: { flexWrap: 'nowrap' },
  topMeta: { justifyContent: 'flex-start' },
}

/* ── MOBILE BREAKPOINT (480px down to 320px) ── */
const mobileStyles = {
  shell: { paddingBottom: 20 },
  topbar: {
    height: 'auto',
    padding: '10px 14px',
    gap: 8,
  },
  topLeft: { gap: 4 },
  topRight: { gap: 8 },
  createBtn: { padding: '6px 12px', fontSize: '11.5px' },
  body: {
    gridTemplateColumns: '1fr',
    gap: 16,
    padding: '14px 12px 40px',
  },
  leftCol: { position: 'static', top: 'auto', gap: 12 },
  coverBox: { aspectRatio: '16 / 10' },
  themeRow: {
    padding: '10px 12px',
    gap: 8
  },
  topMeta: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8
  },
  pill: {
    width: '100%',
    padding: '9px 14px'
  },
  nameInput: {
    fontSize: '28px',
    padding: '4px 0'
  },
  fieldRow: { padding: '12px 14px' },
  timeRow: { padding: '12px 14px' },
  optionRow: { padding: '12px 14px' },
  optionsTitle: { marginBottom: 6 },
  submitBtn: {
    padding: '14px 0',
    borderRadius: 12,
    fontSize: '15px'
  },
}