import { useState, useEffect, useRef } from 'react'
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
]

export default function CreateEventPage() {
  const navigate = useNavigate()
  const API_BASE = '/api'

  /* form state */
  const [name,        setName]        = useState('')
  const [startDate,   setStartDate]   = useState(today())
  const [startTime,   setStartTime]   = useState(nowHour())
  const [endDate,     setEndDate]     = useState(today())
  const [endTime,     setEndTime]     = useState(todayPlus1h())
  const [location,    setLocation]    = useState('')
  const [description, setDescription] = useState('')
  const [isPublic,    setIsPublic]    = useState(true)
  const [ticketPrice, setTicketPrice] = useState('Free')
  const [requireApproval, setRequireApproval] = useState(false)
  const [capacity,    setCapacity]    = useState('Unlimited')
  const [themeIdx,    setThemeIdx]    = useState(0)
  const [editingPrice, setEditingPrice] = useState(false)
  const [editingCap,   setEditingCap]   = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [coverFile,   setCoverFile]   = useState(null)
  const [coverUrl,    setCoverUrl]    = useState(null)
  const [coverImageData, setCoverImageData] = useState('')
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
        requireApproval, capacity, theme: theme.id,
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
      if (!res.ok) throw new Error(data.message || 'Failed to create event')
      navigate(`/events/${data.event.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  /* gradient bg string */
  const bgGrad = `linear-gradient(135deg, ${theme.bg[0]} 0%, ${theme.bg[1]} 100%)`

  return (
    <div style={{ ...S.shell, background: bgGrad }}>

      {/* ── TOPBAR ── */}
      <header style={S.topbar}>
        <nav style={S.topLeft}>
          <span style={{ ...S.starLogo, color: theme.accent }}>✦</span>
          <a href="/events"    style={S.navLink}><span style={S.navIcon}>▦</span> Events</a>
          <a href="/calendars" style={{ ...S.navLink, color: '#5a7a7a' }}><span style={S.navIcon}>📅</span> Calendars</a>
          <a href="/discover"  style={{ ...S.navLink, color: '#5a7a7a' }}><span style={S.navIcon}>◎</span> Discover</a>
        </nav>
        <div style={S.topRight}>
          <span style={S.timeChip}>{new Intl.DateTimeFormat('en-NG',{hour:'2-digit',minute:'2-digit',timeZone:'Africa/Lagos',timeZoneName:'short'}).format(new Date())}</span>
          <button style={{ ...S.createBtn, background: theme.accent, color: '#0a0a0a' }}>
            Create Event
          </button>
          <div style={S.avatar}>🙂</div>
        </div>
      </header>

      {/* ── BODY ── */}
      <form onSubmit={handleSubmit} style={S.body}>

        {/* ── LEFT COLUMN ── */}
        <div style={S.leftCol}>

          {/* cover image */}
          <div
            style={{
              ...S.coverBox,
              background: coverUrl
                ? `url(${coverUrl}) center/cover`
                : `linear-gradient(135deg, ${theme.accent}22 0%, ${theme.bg[1]} 100%)`,
              border: `1px solid ${theme.accent}30`,
            }}
            onClick={() => fileRef.current.click()}
          >
            {!coverUrl && (
              <div style={S.coverPlaceholder}>
                {/* abstract shape */}
                <svg width="140" height="140" viewBox="0 0 140 140" fill="none" style={{ opacity: .55 }}>
                  <ellipse cx="70" cy="70" rx="40" ry="55" stroke={theme.accent} strokeWidth="2" fill="none"/>
                  <ellipse cx="70" cy="70" rx="55" ry="30" stroke={theme.accent} strokeWidth="1.5" fill="none" strokeDasharray="4 4"/>
                  <circle cx="70" cy="70" r="8" fill={theme.accent} opacity=".5"/>
                  <path d="M30 50 Q70 20 110 50" stroke={theme.accent} strokeWidth="1.5" fill="none" opacity=".5"/>
                  <path d="M30 90 Q70 120 110 90" stroke={theme.accent} strokeWidth="1.5" fill="none" opacity=".5"/>
                </svg>
              </div>
            )}
            {/* camera button */}
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
          <div style={S.themeRow}>
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
        <div style={S.rightCol}>

          {/* calendar + visibility row */}
          <div style={S.topMeta}>
            <button type="button" style={{ ...S.pill, border:`1px solid ${theme.accent}40` }}>
              <span style={{ fontSize:16 }}>🙂</span>
              <span>Personal Calendar</span>
              <span style={{ opacity:.5 }}>▾</span>
            </button>
            <button
              type="button"
              style={{ ...S.pill, border:`1px solid ${theme.accent}40` }}
              onClick={() => setIsPublic(p => !p)}
            >
              <span>{isPublic ? '🌐' : '🔒'}</span>
              <span>{isPublic ? 'Public' : 'Private'}</span>
              <span style={{ opacity:.5 }}>▾</span>
            </button>
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
              caretColor: theme.accent,
            }}
          />

          {/* date/time block */}
          <div style={{ ...S.fieldBox, border:`1px solid ${theme.accent}20` }}>
            {/* start */}
            <div style={S.timeRow}>
              <span style={S.timeDot}>●</span>
              <span style={S.timeLabel}>Start</span>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={S.dateInput}/>
              <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} style={S.timeInput}/>
            </div>
            <div style={S.timeSep}/>
            {/* end */}
            <div style={S.timeRow}>
              <span style={{ ...S.timeDot, opacity:.4 }}>○</span>
              <span style={S.timeLabel}>End</span>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={S.dateInput}/>
              <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} style={S.timeInput}/>
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
          <div style={{ ...S.fieldBox, border:`1px solid ${theme.accent}20`, cursor:'text' }}
            onClick={() => document.getElementById('loc-input').focus()}>
            <div style={S.fieldRow}>
              <span style={S.fieldIcon}>📍</span>
              <input
                id="loc-input"
                type="text"
                placeholder="Add Event Location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                style={S.fieldInlineInput}
              />
            </div>
            {!location && (
              <div style={{ paddingLeft:36, fontSize:12, color:'#3d6a6a', marginTop:2 }}>
                Offline location or virtual link
              </div>
            )}
          </div>

          {/* description */}
          <div style={{ ...S.fieldBox, border:`1px solid ${theme.accent}20` }}>
            <div style={S.fieldRow}>
              <span style={S.fieldIcon}>📝</span>
              <textarea
                placeholder="Add Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={S.textarea}
              />
            </div>
          </div>

          {/* event options */}
          <div style={S.optionsBlock}>
            <p style={S.optionsTitle}>Event Options</p>

            <div style={{ ...S.optionBox, border:`1px solid ${theme.accent}18` }}>

              {/* ticket price */}
              <div style={S.optionRow}>
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

              <div style={{ ...S.optionDivider, background:`${theme.accent}12` }}/>

              {/* require approval */}
              <div style={S.optionRow}>
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

              <div style={{ ...S.optionDivider, background:`${theme.accent}12` }}/>

              {/* capacity */}
              <div style={S.optionRow}>
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
  },
  textarea: {
    flex:1, background:'transparent', border:'none', outline:'none',
    fontSize:14, color:'#c0d8d8', resize:'none',
    fontFamily:"'DM Sans',system-ui,sans-serif",
    lineHeight:1.6,
  },

  /* date/time */
  timeRow: { display:'flex', alignItems:'center', gap:10, padding:'14px 16px' },
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
  optionRow: { display:'flex', alignItems:'center', gap:12, padding:'14px 18px' },
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