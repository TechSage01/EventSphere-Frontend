import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const themeMap = {
  minimal:  { bg: ['#10262b', '#081722'], accent: '#5eead4' },
  aurora:   { bg: ['#1a0533', '#0d1f3c'], accent: '#a78bfa' },
  sunrise:  { bg: ['#2d1a0e', '#1f0d1a'], accent: '#fb923c' },
  ocean:    { bg: ['#0a1628', '#061a2e'], accent: '#38bdf8' },
  forest:   { bg: ['#0d2110', '#0a1a0d'], accent: '#4ade80' },
  rose:     { bg: ['#2d0a1a', '#1a0a1a'], accent: '#fb7185' },
}

export default function EventOverviewPage({ user = null }) {
  const { eventId } = useParams()
  const navigate    = useNavigate()

  const [event,           setEvent]           = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState('')
  const [editing,         setEditing]         = useState(false)
  const [editForm,        setEditForm]        = useState(null)
  const [savingEvent,     setSavingEvent]     = useState(false)
  const [savingVis,       setSavingVis]       = useState(false)
  const [inviteEmails,    setInviteEmails]    = useState('')
  const [sendingInvites,  setSendingInvites]  = useState(false)
  const [hostForm,        setHostForm]        = useState({ name:'', email:'', role:'Co-host' })
  const [addingHost,      setAddingHost]      = useState(false)
  const [toast,           setToast]           = useState('')

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  /* ── load event ── */
  useEffect(() => {
    async function load() {
      setLoading(true); setError('')
      try {
        const token = localStorage.getItem('es_token')
        const res   = await fetch(`/api/events/${eventId}`, { headers: { Authorization: `Bearer ${token}` } })
        const payload  = await res.json()
        if (!res.ok) throw new Error(payload.message || 'Failed to load event')
        setEvent(payload.data?.event)
      } catch (err) { setError(err.message) }
      finally       { setLoading(false) }
    }
    load()
  }, [eventId])

  useEffect(() => {
    if (!event) return
    setEditForm({
      title: event.title || '', startDate: event.startDate || '',
      startTime: event.startTime || '', endDate: event.endDate || '',
      endTime: event.endTime || '', location: event.location || '',
      coverImage: event.coverImage || '',
    })
  }, [event])

  /* ── actions ── */
  async function handleSaveEvent() {
    if (!editForm) return
    setSavingEvent(true)
    try {
      const token = localStorage.getItem('es_token')
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(editForm),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message)
      setEvent(payload.data?.event); setEditing(false); showToast('Event saved.')
    } catch (err) { setError(err.message) }
    finally       { setSavingEvent(false) }
  }

  async function handleToggleVisibility() {
    setSavingVis(true)
    try {
      const token = localStorage.getItem('es_token')
      const res = await fetch(`/api/events/${eventId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ isPublic: !event.isPublic }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message)
      setEvent(payload.data?.event)
    } catch (err) { setError(err.message) }
    finally       { setSavingVis(false) }
  }

  async function handleSendInvitations() {
    setSendingInvites(true)
    try {
      const token = localStorage.getItem('es_token')
      const res = await fetch(`/api/events/${eventId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ emails: inviteEmails }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message)
      setEvent(payload.data?.event); setInviteEmails(''); showToast('Invitations sent.')
    } catch (err) { setError(err.message) }
    finally       { setSendingInvites(false) }
  }

  async function handleAddHost() {
    if (!hostForm.name.trim() || !hostForm.email.trim()) { setError('Name and email required'); return }
    setAddingHost(true); setError('')
    try {
      const token = localStorage.getItem('es_token')
      const res = await fetch(`/api/events/${eventId}/hosts`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(hostForm),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message)
      setEvent(payload.data?.event); setHostForm({ name:'', email:'', role:'Co-host' }); showToast('Host added.')
    } catch (err) { setError(err.message) }
    finally       { setAddingHost(false) }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/public/events/${event?.id}`
    try { await navigator.clipboard.writeText(url); showToast('Link copied!') }
    catch { showToast('Copy from address bar.') }
  }

  async function handleOneClickRsvp() {
    if (!user?.name || !user?.email) {
      showToast('Your profile name and email are needed to RSVP.')
      return
    }

    try {
      const res = await fetch(`/api/events/public/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, email: user.email, note: '' }),
      })
      const payload = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          showToast(payload.message || 'You have already RSVP’d for this event.')
          return
        }
        throw new Error(payload.message || 'Failed to RSVP')
      }

      setEvent(payload.data?.event)
      showToast('RSVP confirmed.')
    } catch (err) {
      showToast(err.message)
    }
  }

  /* ── loading / error shells ── */
  if (loading)           return <LoadingShell />
  if (error && !event)   return <ErrorShell message={error} onBack={() => navigate('/events')} />
  if (!event)            return <ErrorShell message="Event not found" onBack={() => navigate('/events')} />

  const theme        = themeMap[event.theme] || themeMap.minimal
  const rsvpCount    = event.rsvpCount || (Array.isArray(event.rsvps) ? event.rsvps.length : 0)
  const invitedGuests= Array.isArray(event.invitedGuests) ? event.invitedGuests : []
  const publicUrl    = `${window.location.origin}/public/events/${event.id}`
  const shortUrl     = `eventsphere.com/${event.id?.slice(0,8) || 'preview'}`

  return (
    <div style={{ ...s.page, background:'#111114' }}>

      {/* ── sticky topbar ── */}
      <header style={s.topbar}>
        <div style={s.topbarLeft}>
          <span style={s.logo}>✦</span>
          <span style={s.brand}>EventSphere</span>
        </div>
        <button style={s.eventPageBtn} onClick={() => navigate(`/public/events/${event.id}`)}>
          Event Page ↗
        </button>
        <button style={s.adminBtn} onClick={() => navigate(`/events/${event.id}/admin`)}>
          Admin ↗
        </button>
      </header>

      <main style={s.main}>

        {/* breadcrumb */}
        <div style={s.breadcrumb}>
          <span style={s.breadcrumbLink} onClick={() => navigate('/events')}>Personal</span>
          <span style={s.breadcrumbSep}>›</span>
          <span>{event.title}</span>
        </div>

        {/* hero row */}
        <div style={s.heroRow}>
          <div>
            <h1 style={s.heroTitle}>{event.title}</h1>
            <div style={s.chips}>
              <Chip>{fmtDateLong(event.startDate)}</Chip>
              <Chip>{fmtTimeRange(event.startTime, event.endTime)}</Chip>
              <Chip>{event.isPublic ? '🌐 Public' : '🔒 Private'}</Chip>
              <Chip>{rsvpCount} RSVPs</Chip>
            </div>
          </div>
          <div style={s.heroActions}>
            <Btn onClick={() => setEditing(v=>!v)}>{editing ? 'Close' : 'Edit Event'}</Btn>
            <Btn ghost onClick={() => navigate(`/events/${event.id}/admin`)}>Admin</Btn>
          </div>
        </div>

        {/* tabs */}
        <div style={s.tabs}>
          {['Overview','Guests','Registration','Blasts','Insights'].map((t,i) => (
            <button key={t} style={{ ...s.tab, ...(i===0 ? s.tabActive : {}) }}>{t}</button>
          ))}
        </div>

        {/* quick action cards — exactly like screenshot */}
        <div style={s.actionRow}>
          <ActionCard icon="✉" label="Invite Guests"  color="#3b82f6"
            onClick={() => document.getElementById('invite-section')?.scrollIntoView({behavior:'smooth'})} />
          <ActionCard icon="▣" label="Send a Blast"   color="#a855f7"
            onClick={() => document.getElementById('blast-section')?.scrollIntoView({behavior:'smooth'})} />
          <ActionCard icon="↗" label="Share Event"    color="#ec4899"
            onClick={handleCopyLink} />
        </div>

        {toast && <div style={s.toast}>{toast}</div>}
        {error && <div style={s.errorBanner}>{error}</div>}

        {/* ── two-column body ── */}
        <div style={s.cols}>

          {/* ══ LEFT ══ */}
          <div style={s.leftCol}>

            {/* event preview card — the main card from screenshot */}
            <div style={s.previewCard}>
              {/* cover + info row */}
              <div style={s.previewTop}>
                {/* cover square */}
                <div style={s.coverSquare}>
                  {event.coverImage
                    ? <img src={event.coverImage} alt={event.title} style={s.coverImg}/>
                    : <CoverPlaceholder accent={theme.accent}/>
                  }
                </div>

                {/* right of cover */}
                <div style={s.previewInfo}>
                  <h2 style={s.previewTitle}>{event.title}</h2>

                  {/* date row */}
                  <div style={s.previewDateRow}>
                    <div style={s.dateBadge}>
                      <span style={s.dateMonth}>{getMonth(event.startDate).toUpperCase()}</span>
                      <span style={s.dateDay}>{getDay(event.startDate)}</span>
                    </div>
                    <div>
                      <div style={s.dateLabel}>{fmtDateLong(event.startDate)}</div>
                      <div style={s.timeLabel}>{fmtTimeRange(event.startTime, event.endTime)}</div>
                    </div>
                  </div>

                  {/* location */}
                  <div style={s.locationRow}>
                    <span style={s.locationIcon}>📍</span>
                    <span style={s.locationText}>
                      {event.location || 'Register to See Address'}
                    </span>
                  </div>

                  {/* hosted by */}
                  <div style={s.hostedBy}>
                    <span style={s.hostedByLabel}>Hosted By</span>
                    <div style={s.hostInlineRow}>
                      <div style={s.hostAvatarSm}>{initials(event.hostName || user?.name)}</div>
                      <span style={s.hostInlineName}>{event.hostName || user?.name || 'Creator'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* registration card */}
              <div style={s.regCard}>
                <div style={s.regLabel}>Registration</div>
                <p style={s.regCopy}>
                  Welcome, <strong>{user?.name || event.hostName || 'Creator'}</strong>! To join the event, please register below.
                </p>
                <div style={s.regHostRow}>
                  <div style={s.regHostAvatar}>{initials(event.hostName || user?.name)}</div>
                  <div>
                    <div style={s.regHostName}>{event.hostName || user?.name || 'Creator'}</div>
                    <div style={s.regHostEmail}>{event.hostEmail || user?.email || ''}</div>
                  </div>
                </div>
                <button type="button" style={s.rsvpBtn} onClick={handleOneClickRsvp}>One-Click RSVP</button>
              </div>

              {/* share bar */}
              <div style={s.shareBar}>
                <span style={s.shareUrl}>{shortUrl}</span>
                <button style={s.shareArrow} onClick={() => navigate(`/public/events/${event.id}`)}>↗</button>
                <div style={s.shareSep}/>
                <button style={s.copyBtn} onClick={handleCopyLink}>COPY</button>
              </div>
            </div>

            {/* bottom action bar — exactly like screenshot */}
            <div style={s.bottomBar}>
              <div style={s.socialRow}>
                <span style={s.shareLabel}>Share Event</span>
                {['𝕗','𝕏','in','💬'].map(ic=>(
                  <button key={ic} style={s.socialBtn}>{ic}</button>
                ))}
              </div>
              <div style={s.bottomActions}>
                <button style={s.bottomBtn} onClick={() => setEditing(v=>!v)}>
                  {editing ? 'Close Editor' : 'Edit Event'}
                </button>
                <button style={s.bottomBtn}>Change Photo</button>
              </div>
            </div>

            {/* ── edit section ── */}
            {editing && editForm && (
              <Section title="Edit Event" sub="Update title, dates, location and cover.">
                <div style={s.editGrid}>
                  {[
                    { label:'Title',      key:'title',     type:'text' },
                    { label:'Location',   key:'location',  type:'text' },
                    { label:'Start Date', key:'startDate', type:'date' },
                    { label:'Start Time', key:'startTime', type:'time' },
                    { label:'End Date',   key:'endDate',   type:'date' },
                    { label:'End Time',   key:'endTime',   type:'time' },
                  ].map(f => (
                    <label key={f.key} style={s.editField}>
                      <span style={s.editLabel}>{f.label}</span>
                      <input
                        type={f.type}
                        value={editForm[f.key]}
                        onChange={e => setEditForm(p=>({...p,[f.key]:e.target.value}))}
                        style={s.editInput}
                      />
                    </label>
                  ))}
                  <label style={{ ...s.editField, gridColumn:'1/-1' }}>
                    <span style={s.editLabel}>Cover Image</span>
                    <input type="file" accept="image/*" style={s.fileInput}
                      onChange={e=>{
                        const f=e.target.files?.[0]; if(!f) return
                        const r=new FileReader()
                        r.onload=()=>setEditForm(p=>({...p,coverImage:String(r.result||'')}))
                        r.readAsDataURL(f)
                      }}
                    />
                  </label>
                </div>
                <div style={s.editFooter}>
                  <Btn ghost onClick={()=>setEditing(false)}>Cancel</Btn>
                  <Btn onClick={handleSaveEvent} disabled={savingEvent}>
                    {savingEvent ? 'Saving…' : 'Save Changes'}
                  </Btn>
                </div>
              </Section>
            )}

            {/* ── invite section ── */}
            <div id="invite-section">
              <Section title="Invitations" sub="Invite guests via email." action={<Btn small>+ Invite Guests</Btn>}>
                <textarea
                  placeholder="Enter emails separated by commas or new lines"
                  value={inviteEmails}
                  onChange={e=>setInviteEmails(e.target.value)}
                  rows={4}
                  style={s.textarea}
                />
                <div style={{ marginTop:10 }}>
                  <Btn onClick={handleSendInvitations} disabled={sendingInvites}>
                    {sendingInvites ? 'Sending…' : 'Send Invitations'}
                  </Btn>
                </div>
                {invitedGuests.length === 0
                  ? <EmptyBlock title="No Invitations Sent" body="Invite subscribers, contacts and past guests." />
                  : <div style={s.inviteList}>
                      {invitedGuests.map(g=>(
                        <div key={g.email+g.sentAt} style={s.inviteItem}>
                          <span>✉</span>
                          <span style={{flex:1}}>{g.email}</span>
                          <span style={s.sentAt}>{fmtDate(g.sentAt)}</span>
                        </div>
                      ))}
                    </div>
                }
              </Section>
            </div>

            {/* ── hosts ── */}
            <Section title="Hosts" action={<Btn small onClick={()=>document.getElementById('host-form')?.scrollIntoView({behavior:'smooth'})}>+ Add Host</Btn>}>
              <div style={s.hostCard}>
                <div style={s.hostAvatarLg}>{initials(event.hostName || user?.name)}</div>
                <div style={s.hostCardBody}>
                  <div style={s.hostCardNameRow}>
                    <strong>{event.hostName || user?.name || 'Creator'}</strong>
                    <span style={s.badge}>Creator</span>
                  </div>
                  <div style={s.hostCardEmail}>{event.hostEmail || user?.email || ''}</div>
                </div>
              </div>

              <div id="host-form" tabIndex={-1} style={s.hostComposer}>
                <div style={s.hostComposerTitle}>Add a co-host</div>
                <div style={s.hostComposerGrid}>
                  {['name','email','role'].map(k=>(
                    <input key={k}
                      value={hostForm[k]}
                      onChange={e=>setHostForm(p=>({...p,[k]:e.target.value}))}
                      placeholder={k.charAt(0).toUpperCase()+k.slice(1)}
                      type={k==='email'?'email':'text'}
                      style={s.hostInput}
                    />
                  ))}
                  <Btn onClick={handleAddHost} disabled={addingHost}>
                    {addingHost ? 'Adding…' : 'Add Host'}
                  </Btn>
                </div>
              </div>
            </Section>

            {/* ── visibility ── */}
            <Section title="Visibility & Discovery" sub="Control how people find your event.">
              <div style={s.visCard}>
                <div style={s.visTop}>
                  <div>
                    <div style={s.visCalLabel}>Managing Calendar</div>
                    <div style={s.visCalName}>Your Personal Calendar</div>
                  </div>
                  <span style={{ ...s.visBadge, color: event.isPublic ? '#86efac' : '#fca5a5' }}>
                    {event.isPublic ? '🌐 Public' : '🔒 Private'}
                  </span>
                </div>
                <div style={s.visActions}>
                  <Btn onClick={handleToggleVisibility} disabled={savingVis}>
                    {savingVis ? 'Updating…' : event.isPublic ? 'Change Visibility' : 'Make Public'}
                  </Btn>
                  <Btn ghost>Transfer Calendar</Btn>
                </div>
              </div>
            </Section>

            {/* ── blasts ── */}
            <div id="blast-section">
              <Section title="Blasts" sub="Event-wide announcements.">
                <EmptyBlock title="No blasts yet" body="Compose and send a blast to all registered guests." />
              </Section>
            </div>

            <p style={s.footerNote}>
              Submit your event to an EventSphere discovery page for a chance to be featured and reach more people.
            </p>
          </div>

          {/* ══ RIGHT SIDEBAR ══ */}
          <aside style={s.sidebar}>
            <div style={s.whenCard}>
              <h3 style={s.whenTitle}>When &amp; Where</h3>

              {/* date row */}
              <div style={s.whenDateRow}>
                <div style={s.calBadge}>
                  <span style={s.calMonth}>{getMonth(event.startDate).toUpperCase()}</span>
                  <span style={s.calDay}>{getDay(event.startDate)}</span>
                </div>
                <div>
                  <div style={s.whenDayLabel}>Today</div>
                  <div style={s.whenTime}>{fmtTimeRange(event.startTime, event.endTime)} GMT+1</div>
                </div>
              </div>

              <div style={s.whenDivider}/>

              {/* location alert */}
              <div style={s.locationAlert}>
                <div style={s.alertIconBox}>⚠</div>
                <div>
                  <div style={s.alertTitle}>
                    {event.location ? 'Location Set' : 'Location Missing'}
                  </div>
                  <div style={s.alertBody}>
                    {event.location || 'Please enter the location of the event before it starts.'}
                  </div>
                </div>
              </div>

              <div style={s.whenDivider}/>

              {/* visibility */}
              <div style={s.sideVisSection}>
                <div style={s.sideVisLabel}>Visibility</div>
                <div style={s.sideVisValue}>{event.isPublic ? 'Public' : 'Private'}</div>
                <div style={s.sideVisCopy}>
                  {event.isPublic
                    ? 'Anyone with the link can discover this event.'
                    : 'Only invited guests can see this event.'}
                </div>
                <button style={s.sideVisBtn} onClick={handleToggleVisibility} disabled={savingVis}>
                  {savingVis ? 'Updating…' : event.isPublic ? 'Make Private' : 'Make Public'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

/* ══════════════════════════════════════════
   SMALL COMPONENTS
══════════════════════════════════════════ */
function ActionCard({ icon, label, color, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      style={{ ...s.actionCard, background: hov ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)' }}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={onClick}
    >
      <div style={{ ...s.actionIconBox, background:`${color}22`, color }}>{icon}</div>
      <span style={s.actionLabel}>{label}</span>
    </button>
  )
}

function CoverPlaceholder({ accent }) {
  return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
      background:`linear-gradient(135deg, ${accent}30 0%, rgba(255,255,255,0.03) 100%)` }}>
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="28" stroke={accent} strokeWidth="1.5" opacity=".4"/>
        <circle cx="40" cy="40" r="14" fill={accent} opacity=".15"/>
        <circle cx="40" cy="40" r="6"  fill={accent} opacity=".5"/>
      </svg>
    </div>
  )
}

function Chip({ children }) {
  return <span style={s.chip}>{children}</span>
}

function Btn({ children, onClick, disabled, ghost, small }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        ...s.btn,
        ...(ghost ? s.btnGhost : {}),
        ...(small ? s.btnSmall : {}),
        opacity: disabled ? .5 : 1,
        background: ghost ? 'transparent' : hov ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </button>
  )
}

function Section({ title, sub, action, children }) {
  return (
    <section style={s.section}>
      <div style={s.sectionHead}>
        <div>
          <h3 style={s.sectionTitle}>{title}</h3>
          {sub && <p style={s.sectionSub}>{sub}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  )
}

function EmptyBlock({ title, body }) {
  return (
    <div style={s.emptyBlock}>
      <div style={s.emptyTitle}>{title}</div>
      <div style={s.emptyBody}>{body}</div>
    </div>
  )
}

function LoadingShell() {
  return (
    <div style={s.shell}>
      <div style={s.shellCard}>
        <div style={{ fontSize:28, marginBottom:12, animation:'spin 1s linear infinite' }}>✦</div>
        <div style={{ color:'#9a9aaa' }}>Loading event...</div>
      </div>
    </div>
  )
}

function ErrorShell({ message, onBack }) {
  return (
    <div style={s.shell}>
      <div style={s.shellCard}>
        <div style={{ fontSize:16, marginBottom:16, color:'#f87171' }}>{message}</div>
        <button style={s.btn} onClick={onBack}>← Back to Events</button>
      </div>
    </div>
  )
}

/* ── date helpers ── */
function fmtDateLong(d) {
  if (!d) return 'Date TBC'
  const date = new Date(d)
  return isNaN(date) ? d : new Intl.DateTimeFormat('en-NG',{weekday:'long',day:'numeric',month:'long'}).format(date)
}
function fmtTimeRange(s,e) {
  if (!s && !e) return 'Time TBC'
  return [s,e].filter(Boolean).join(' - ')
}
function getMonth(d) {
  const date = new Date(d)
  return isNaN(date.getTime()) ? '---' : new Intl.DateTimeFormat('en-NG',{month:'short'}).format(date)
}
function getDay(d) {
  const date = new Date(d)
  return isNaN(date.getTime()) ? '--' : new Intl.DateTimeFormat('en-NG',{day:'2-digit'}).format(date)
}
function initials(name) {
  return String(name||'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]?.toUpperCase()).join('')||'E'
}
function fmtDate(v) {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en-NG',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)
}

/* ══════════════════════════════════════════
   STYLES
══════════════════════════════════════════ */
const s = {
  /* shell */
  page:     { minHeight:'100vh', background:'#111114', color:'#ececf0', fontFamily:"'DM Sans',system-ui,sans-serif", WebkitFontSmoothing:'antialiased' },
  shell:    { minHeight:'100vh', display:'grid', placeItems:'center', background:'#111114', color:'#ececf0', fontFamily:"'DM Sans',system-ui,sans-serif" },
  shellCard:{ padding:32, borderRadius:20, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', textAlign:'center' },

  /* topbar */
  topbar:      { height:60, padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(17,17,20,0.9)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, zIndex:50 },
  topbarLeft:  { display:'flex', alignItems:'center', gap:10 },
  logo:        { color:'#a78bfa', fontSize:20 },
  brand:       { fontSize:16, fontWeight:700, letterSpacing:'-.3px' },
  eventPageBtn:{ background:'rgba(255,255,255,0.07)', color:'#ccc', border:'1px solid rgba(255,255,255,0.08)', borderRadius:999, padding:'8px 16px', fontWeight:600, cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',system-ui,sans-serif" },
  adminBtn:    { background:'rgba(167,139,250,0.16)', color:'#ddd6fe', border:'1px solid rgba(167,139,250,0.24)', borderRadius:999, padding:'8px 16px', fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',system-ui,sans-serif", marginLeft:10 },

  /* layout */
  main:     { maxWidth:1160, margin:'0 auto', padding:'28px 24px 80px' },
  cols:     { display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' },
  leftCol:  { display:'flex', flexDirection:'column', gap:20 },
  sidebar:  { position:'sticky', top:80 },

  /* breadcrumb */
  breadcrumb:     { display:'flex', alignItems:'center', gap:6, color:'#6b6b7a', fontSize:14, marginBottom:16 },
  breadcrumbLink: { cursor:'pointer', color:'#9a9aaa', transition:'color .15s' },
  breadcrumbSep:  { opacity:.4 },

  /* hero */
  heroRow:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:20, marginBottom:14 },
  heroTitle:  { fontSize:'clamp(32px,4vw,52px)', fontWeight:900, letterSpacing:'-2px', margin:0, lineHeight:1.05 },
  chips:      { display:'flex', gap:8, flexWrap:'wrap', marginTop:12 },
  chip:       { padding:'6px 12px', borderRadius:999, background:'rgba(255,255,255,0.06)', color:'#b0b0be', fontSize:12.5, border:'1px solid rgba(255,255,255,0.05)', fontWeight:500 },
  heroActions:{ display:'flex', gap:8, flexShrink:0 },

  /* tabs */
  tabs:    { display:'flex', gap:24, borderBottom:'1px solid rgba(255,255,255,0.07)', marginBottom:20 },
  tab:     { background:'none', border:'none', color:'#6b6b7a', padding:'12px 0', fontSize:14.5, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',system-ui,sans-serif", transition:'color .15s' },
  tabActive:{ color:'#f0f0f4', borderBottom:'2px solid #f0f0f4', marginBottom:-1 },

  /* action row */
  actionRow: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 },
  actionCard:{ display:'flex', alignItems:'center', gap:14, padding:'0 20px', height:72, borderRadius:16, border:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', transition:'background .15s', fontFamily:"'DM Sans',system-ui,sans-serif" },
  actionIconBox:{ width:38, height:38, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 },
  actionLabel:{ fontSize:15, fontWeight:700, color:'#e0e0ea' },

  /* toast / error */
  toast:       { padding:'10px 16px', borderRadius:12, background:'rgba(94,234,212,0.12)', border:'1px solid rgba(94,234,212,0.2)', color:'#5eead4', fontSize:13, marginBottom:14 },
  errorBanner: { padding:'10px 16px', borderRadius:12, background:'rgba(248,113,113,0.10)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', fontSize:13, marginBottom:14 },

  /* ── preview card ── */
  previewCard: { background:'#1a1a1f', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, overflow:'hidden', boxShadow:'0 8px 40px rgba(0,0,0,0.4)' },
  previewTop:  { display:'flex', gap:0, padding:0 },

  /* cover square */
  coverSquare: { width:220, flexShrink:0, minHeight:220, background:'#222228', position:'relative', overflow:'hidden' },
  coverImg:    { width:'100%', height:'100%', objectFit:'cover', display:'block' },

  /* preview info (right of cover) */
  previewInfo:     { flex:1, padding:'20px 22px', display:'flex', flexDirection:'column', gap:14 },
  previewTitle:    { fontSize:24, fontWeight:800, letterSpacing:'-.5px', margin:0, color:'#f0f0f4' },
  previewDateRow:  { display:'flex', alignItems:'center', gap:12 },
  dateBadge:       { width:54, height:54, borderRadius:12, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 },
  dateMonth:       { fontSize:10, color:'#7a7a8a', fontWeight:700 },
  dateDay:         { fontSize:22, fontWeight:800, lineHeight:1.1, color:'#e8e8f0' },
  dateLabel:       { fontSize:14, fontWeight:700, color:'#e8e8f0', marginBottom:2 },
  timeLabel:       { fontSize:13, color:'#9a9aaa' },
  locationRow:     { display:'flex', alignItems:'center', gap:8 },
  locationIcon:    { fontSize:14 },
  locationText:    { fontSize:13.5, color:'#c0c0cc', fontWeight:500 },
  hostedBy:        { marginTop:'auto', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.06)' },
  hostedByLabel:   { fontSize:11, color:'#5a5a6a', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px' },
  hostInlineRow:   { display:'flex', alignItems:'center', gap:8 },
  hostAvatarSm:    { width:26, height:26, borderRadius:'50%', background:'#f5c842', color:'#111', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 },
  hostInlineName:  { fontSize:13.5, fontWeight:600, color:'#d0d0da' },

  /* registration card */
  regCard:      { margin:'0 18px 0', padding:'16px 18px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16 },
  regLabel:     { fontSize:11, fontWeight:700, color:'#6b6b7a', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 },
  regCopy:      { fontSize:13.5, color:'#c0c0cc', lineHeight:1.55, marginBottom:12 },
  regHostRow:   { display:'flex', alignItems:'center', gap:10, marginBottom:14 },
  regHostAvatar:{ width:30, height:30, borderRadius:'50%', background:'#f5c842', color:'#111', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, flexShrink:0 },
  regHostName:  { fontSize:14, fontWeight:700, color:'#e0e0ea', marginBottom:1 },
  regHostEmail: { fontSize:12, color:'#6b6b7a' },
  rsvpBtn:      { width:'100%', background:'#f4f4f5', color:'#111', border:'none', borderRadius:10, padding:'11px 0', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:"'DM Sans',system-ui,sans-serif" },

  /* share bar */
  shareBar: { display:'flex', alignItems:'center', gap:10, padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.18)' },
  shareUrl:  { flex:1, fontSize:13, color:'#7a7a8a', fontVariantNumeric:'tabular-nums', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  shareArrow:{ background:'none', border:'none', color:'#7a7a8a', fontSize:16, cursor:'pointer', padding:'0 4px' },
  shareSep:  { width:1, height:18, background:'rgba(255,255,255,0.08)' },
  copyBtn:   { background:'none', border:'none', color:'#9a9aaa', fontWeight:800, fontSize:12, cursor:'pointer', letterSpacing:'.5px', fontFamily:"'DM Sans',system-ui,sans-serif", padding:'0 4px' },

  /* bottom action bar */
  bottomBar:     { background:'#1a1a1f', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  socialRow:     { display:'flex', alignItems:'center', gap:12 },
  shareLabel:    { fontSize:13.5, fontWeight:600, color:'#6b6b7a', marginRight:4 },
  socialBtn:     { background:'none', border:'none', color:'#9a9aaa', fontSize:16, cursor:'pointer', padding:'4px 6px', borderRadius:8, transition:'color .15s' },
  bottomActions: { display:'flex', gap:10 },
  bottomBtn:     { background:'rgba(255,255,255,0.08)', color:'#e0e0ea', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 18px', fontWeight:700, fontSize:13.5, cursor:'pointer', fontFamily:"'DM Sans',system-ui,sans-serif", transition:'background .15s' },

  /* sections */
  section:     { paddingTop:4 },
  sectionHead: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:14 },
  sectionTitle:{ fontSize:22, fontWeight:800, letterSpacing:'-.5px', margin:0, color:'#f0f0f4' },
  sectionSub:  { fontSize:13.5, color:'#7a7a8a', margin:'4px 0 0', lineHeight:1.5 },

  /* edit */
  editGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  editField:   { display:'grid', gap:6 },
  editLabel:   { fontSize:12, fontWeight:700, color:'#6b6b7a', textTransform:'uppercase', letterSpacing:'.4px' },
  editInput:   { width:'100%', boxSizing:'border-box', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(0,0,0,0.25)', color:'#e8e8f0', padding:'10px 12px', fontFamily:"'DM Sans',system-ui,sans-serif", fontSize:14, outline:'none', colorScheme:'dark' },
  fileInput:   { color:'#9a9aaa', fontSize:13 },
  editFooter:  { display:'flex', justifyContent:'flex-end', gap:10, marginTop:16 },

  /* invite */
  textarea:    { width:'100%', boxSizing:'border-box', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(0,0,0,0.2)', color:'#e8e8f0', padding:'12px 14px', fontFamily:"'DM Sans',system-ui,sans-serif", fontSize:13.5, resize:'vertical', outline:'none' },
  inviteList:  { marginTop:12, display:'flex', flexDirection:'column', gap:8 },
  inviteItem:  { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.05)', fontSize:13 },
  sentAt:      { color:'#5a5a6a', fontSize:11.5 },

  /* host */
  hostCard:         { display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' },
  hostAvatarLg:     { width:40, height:40, borderRadius:'50%', background:'#f5c842', color:'#111', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, flexShrink:0 },
  hostCardBody:     { flex:1 },
  hostCardNameRow:  { display:'flex', alignItems:'center', gap:8, marginBottom:2 },
  hostCardEmail:    { fontSize:12.5, color:'#5a5a6a' },
  badge:            { padding:'2px 8px', borderRadius:999, background:'#162a1a', color:'#86efac', fontSize:11, fontWeight:700 },
  hostComposer:     { marginTop:12, padding:'16px 18px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' },
  hostComposerTitle:{ fontSize:15, fontWeight:700, marginBottom:12, color:'#d0d0da' },
  hostComposerGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  hostInput:        { width:'100%', boxSizing:'border-box', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(0,0,0,0.2)', color:'#e8e8f0', padding:'10px 12px', fontFamily:"'DM Sans',system-ui,sans-serif", fontSize:13.5, outline:'none' },

  /* visibility */
  visCard:     { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'18px 20px' },
  visTop:      { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:16 },
  visCalLabel: { fontSize:12, color:'#5a5a6a', marginBottom:4 },
  visCalName:  { fontSize:17, fontWeight:700, color:'#d0d0da' },
  visBadge:    { fontSize:13, fontWeight:700 },
  visActions:  { display:'flex', gap:10, flexWrap:'wrap' },

  /* empty block */
  emptyBlock: { padding:'18px 20px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' },
  emptyTitle: { fontSize:15, fontWeight:700, color:'#9a9aaa', marginBottom:5 },
  emptyBody:  { fontSize:13, color:'#5a5a6a', lineHeight:1.55 },

  footerNote: { fontSize:13, color:'#5a5a6a', lineHeight:1.7, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)' },

  /* sidebar / when card */
  whenCard:    { background:'#1a1a1f', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'22px 20px', boxShadow:'0 8px 40px rgba(0,0,0,0.3)' },
  whenTitle:   { fontSize:26, fontWeight:900, letterSpacing:'-.5px', margin:'0 0 18px', color:'#f0f0f4' },
  whenDateRow: { display:'flex', alignItems:'center', gap:14, marginBottom:20 },
  calBadge:    { width:60, height:60, borderRadius:14, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 },
  calMonth:    { fontSize:11, color:'#5a5a6a', fontWeight:700 },
  calDay:      { fontSize:24, fontWeight:800, lineHeight:1.1, color:'#e8e8f0' },
  whenDayLabel:{ fontSize:20, fontWeight:800, color:'#f0f0f4', marginBottom:4 },
  whenTime:    { fontSize:15, color:'#b0b0be' },
  whenDivider: { height:1, background:'rgba(255,255,255,0.06)', margin:'18px 0' },
  locationAlert:    { display:'flex', gap:12, alignItems:'flex-start' },
  alertIconBox:     { width:40, height:40, borderRadius:12, background:'rgba(251,191,36,0.10)', color:'#fbbf24', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 },
  alertTitle:       { fontSize:16, fontWeight:800, color:'#fbbf24', marginBottom:5 },
  alertBody:        { fontSize:13.5, color:'#9a9aaa', lineHeight:1.55 },
  sideVisSection:   { paddingTop:4 },
  sideVisLabel:     { fontSize:11, fontWeight:700, color:'#5a5a6a', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 },
  sideVisValue:     { fontSize:22, fontWeight:800, color:'#f0f0f4', marginBottom:6 },
  sideVisCopy:      { fontSize:13, color:'#6b6b7a', lineHeight:1.55, marginBottom:14 },
  sideVisBtn:       { width:'100%', background:'rgba(255,255,255,0.07)', color:'#e0e0ea', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'11px 0', fontWeight:700, fontSize:13.5, cursor:'pointer', fontFamily:"'DM Sans',system-ui,sans-serif", transition:'background .15s' },

  /* shared button */
  btn:      { background:'rgba(255,255,255,0.08)', color:'#e0e0ea', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 16px', fontWeight:700, fontSize:13.5, cursor:'pointer', fontFamily:"'DM Sans',system-ui,sans-serif", transition:'background .15s', whiteSpace:'nowrap' },
  btnGhost: { background:'transparent', border:'1px solid rgba(255,255,255,0.10)' },
  btnSmall: { padding:'7px 12px', fontSize:12.5, borderRadius:10 },
}