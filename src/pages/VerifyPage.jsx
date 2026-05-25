import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
 
function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const pendingEmail = location.state?.email || ''
  const pendingName  = location.state?.name || ''
  const email                 = pendingEmail || (localStorage.getItem('es_pending_email') || '')
  const name                  = pendingName  || (localStorage.getItem('es_pending_name')  || '')
  const [otp, setOtp]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMessage, setResendMessage] = useState('')
  const resendTimerRef = useRef(null)
  const otpRef = useRef(null)
  const [flashError, setFlashError] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState(null)
  const API_BASE = import.meta.env.VITE_API_URL || 'https://eventsphere-backend-swqw.onrender.com/api'
 
  async function handleVerify(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
 
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, code: otp }),
      })
      const data = await res.json()
 
      if (!res.ok) throw new Error(data.message || 'Invalid code')
 
      // ✅ Save user + token, then redirect
      localStorage.setItem('es_user',  JSON.stringify(data.user))
      localStorage.setItem('es_token', data.token)
      // clear pending values
      try { localStorage.removeItem('es_pending_email'); localStorage.removeItem('es_pending_name') } catch {}
      navigate('/events', { replace: true })
    } catch (err) {
      const msg = err.message || 'Verification failed'
      setError(msg)
      // if invalid code, clear input, focus and flash red highlight; parse remaining attempts
      if (/invalid code/i.test(msg) || /attempts remaining/i.test(msg)) {
        setOtp('')
        setFlashError(true)
        try { otpRef.current?.focus() } catch {}
        const m = msg.match(/(\d+) attempts remaining/i)
        if (m && m[1]) setRemainingAttempts(Number(m[1]))
        setTimeout(() => setFlashError(false), 700)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email) return setResendMessage('No email to send to')
    if (resendCooldown > 0) return
    setResendLoading(true)
    setResendMessage('')
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to resend')
      setResendMessage('Code sent')
      // start cooldown
      setResendCooldown(30)
      resendTimerRef.current = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(resendTimerRef.current)
            resendTimerRef.current = null
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setResendMessage(err.message || 'Failed to send code')
    } finally {
      setResendLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current)
        resendTimerRef.current = null
      }
    }
  }, [])
 
  return (
    <div style={authShell}>
      <div style={authCard}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✉</div>
        <h1 style={authTitle}>Check your email</h1>
        <p style={authSub}>We sent a 6-digit code to <strong style={{ color: '#e8e8ec' }}>{email}</strong></p>
 
        <form onSubmit={handleVerify} style={{ width: '100%' }}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            ref={otpRef}
            required
            style={authOtpInput}
          />
          {error && <p style={authError}>{error}</p>}
          {remainingAttempts !== null && (
            <div style={{ fontSize: 13, color: '#fca5a5', marginBottom: 8 }}>Attempts remaining: {remainingAttempts}</div>
          )}
          {!email && <p style={authError}>Email is missing — go back and enter your email first.</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <button type="submit" disabled={loading} style={{ ...authBtn, width: 'auto', padding: '12px 20px' }}>
              {loading ? 'Verifying…' : 'Verify code →'}
            </button>
            <div style={{ textAlign: 'right', minWidth: 160 }}>
              <div style={authResendMsg}>{resendMessage}</div>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0 || !email}
                style={ (resendLoading || resendCooldown > 0 || !email) ? authResendBtnDisabled : authResendBtn }
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : (resendLoading ? 'Sending…' : 'Resend code')}
              </button>
            </div>
          </div>
        </form>
 
        <button
          onClick={() => navigate('/signup')}
          style={{ background: 'none', border: 'none', color: '#6b6b76', fontSize: 13, marginTop: 16, cursor: 'pointer' }}
        >
          ← Use a different email
        </button>
      </div>
    </div>
  )
}
 
/* shared auth styles */
const authShell = {
  minHeight: '100vh',
  background: '#14141a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  padding: 24,
}
const authCard = {
  width: '100%',
  maxWidth: 380,
  background: '#1c1c24',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 18,
  padding: '36px 32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
}
const authTitle = { fontSize: 20, fontWeight: 700, color: '#f0f0f4', marginBottom: 8 }
const authSub   = { fontSize: 14, color: '#6b6b76', marginBottom: 24, lineHeight: 1.6 }
const authInput = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 15,
  color: '#e8e8ec',
  outline: 'none',
  marginBottom: 12,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  boxSizing: 'border-box',
}
const authOtpInput = {
  width: '100%',
  maxWidth: 320,
  margin: '0 auto 12px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '14px 18px',
  fontSize: 28,
  color: '#e8e8ec',
  outline: 'none',
  letterSpacing: '0.5em',
  textAlign: 'center',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  boxSizing: 'border-box',
}
const authResendMsg = { fontSize: 12, color: '#9ca3b3', marginBottom: 6, minHeight: 16 }
const authResendBtn = { background: 'transparent', border: '1px solid rgba(154,208,255,0.12)', color: '#9ad0ff', padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }
const authResendBtnDisabled = { ...authResendBtn, opacity: 0.5, cursor: 'default' }
const authOtpInputError = { boxShadow: '0 0 0 4px rgba(248,113,113,0.06)', borderColor: 'rgba(248,113,113,0.6)' }
const authHint = { fontSize: 12, color: '#9ca3b3', marginTop: 6 }
const authBtn = {
  width: '100%',
  background: '#e8e8ec',
  color: '#14141a',
  border: 'none',
  borderRadius: 999,
  padding: '12px 0',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  transition: 'opacity .15s',
}
const authError = { fontSize: 12.5, color: '#f87171', marginBottom: 8, textAlign: 'left' }

export default VerifyPage