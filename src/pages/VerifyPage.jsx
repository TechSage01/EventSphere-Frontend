import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
<<<<<<< HEAD
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
 
=======
  const { setSession } = useAuth()

  const email = location.state?.email || ''
  const name = location.state?.name || ''

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true })
    }
  }, [email, navigate])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }

    const interval = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [countdown])

  // Format countdown time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Auto-focus and move between OTP input boxes
  const inputRefs = useRef([])

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only numbers

    const newOtp = otp.split('')
    newOtp[index] = value
    const otpString = newOtp.join('')
    setOtp(otpString.slice(0, 6))

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    setOtp(pastedData)
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus()
    }
  }

>>>>>>> 8fdb0489db2cb10ce1b6f539fe19613f2976eb8b
  async function handleVerify(e) {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
<<<<<<< HEAD
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
=======
      const payload = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code: otp }),
      })

      const user = payload.data?.user
      const token = payload.data?.token
      if (!user || !token) throw new Error('Missing authentication data')

      setSuccess(payload.message || 'Email verified successfully!')
      setSession(user, token)

      // Redirect after brief delay
      setTimeout(() => {
        navigate('/events', { replace: true })
      }, 500)
    } catch (err) {
      setError(err.message || 'Verification failed')
      setOtp('') // Clear on error
      inputRefs.current[0]?.focus()
>>>>>>> 8fdb0489db2cb10ce1b6f539fe19613f2976eb8b
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
<<<<<<< HEAD
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
=======
    setResendLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload = await apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      })

      const debugCode = payload.data?.debugCode
      setSuccess(
        debugCode ? `New code sent! Dev code: ${debugCode}` : 'New code sent! Check your inbox.'
      )
      setCountdown(600)
      setCanResend(false)
      setOtp('')
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err.message || 'Failed to resend code')
>>>>>>> 8fdb0489db2cb10ce1b6f539fe19613f2976eb8b
    } finally {
      setResendLoading(false)
    }
  }

<<<<<<< HEAD
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
=======
  return (
    <div style={styles.shell}>
      <div style={styles.card}>
        <div style={styles.emoji}>✉</div>
        <h1 style={styles.title}>Check your email</h1>
        <p style={styles.sub}>
          We sent a 6-digit code to <br />
          <strong style={{ color: '#e8e8ec' }}>{email}</strong>
        </p>

        <form onSubmit={handleVerify} style={styles.form}>
          <div style={styles.otpContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                placeholder="0"
                maxLength="1"
                value={otp[index] || ''}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                disabled={loading}
                style={styles.otpInput}
              />
            ))}
          </div>

          {success && <p style={styles.success}>{success}</p>}
          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading || otp.length !== 6} style={styles.btn}>
            {loading ? 'Verifying…' : 'Verify code →'}
          </button>
>>>>>>> 8fdb0489db2cb10ce1b6f539fe19613f2976eb8b
        </form>

        <div style={styles.timerSection}>
          <p style={styles.timerText}>
            Code expires in <strong>{formatTime(countdown)}</strong>
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || resendLoading}
            style={{
              ...styles.resendBtn,
              opacity: canResend ? 1 : 0.5,
              cursor: canResend ? 'pointer' : 'not-allowed',
            }}
          >
            {resendLoading ? 'Sending…' : "Didn't get a code? Resend"}
          </button>
        </div>

        <button
          onClick={() => navigate('/signup', { replace: true })}
          style={styles.backBtn}
        >
          ← Change email
        </button>
      </div>
    </div>
  )
}
<<<<<<< HEAD
 
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
=======
>>>>>>> 8fdb0489db2cb10ce1b6f539fe19613f2976eb8b

const styles = {
  shell: {
    minHeight: '100vh',
    background: '#14141a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    padding: 'clamp(12px, 5vw, 24px)',
    overflow: 'hidden',
  },
  card: {
    width: '100%',
    maxWidth: 'clamp(280px, 90vw, 420px)',
    background: '#1c1c24',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'clamp(12px, 4vw, 18px)',
    padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 32px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  emoji: {
    fontSize: 'clamp(24px, 6vw, 32px)',
    marginBottom: 'clamp(8px, 3vw, 12px)',
  },
  title: {
    fontSize: 'clamp(18px, 5vw, 24px)',
    fontWeight: 700,
    color: '#f0f0f4',
    margin: '0 0 clamp(4px, 2vw, 8px)',
    letterSpacing: '-0.3px',
    wordBreak: 'break-word',
  },
  sub: {
    fontSize: 'clamp(12px, 3.5vw, 14px)',
    color: '#6b6b76',
    margin: '0 0 clamp(16px, 4vw, 24px)',
    lineHeight: 1.6,
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
  form: {
    width: '100%',
    boxSizing: 'border-box',
  },
  otpContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 'clamp(4px, 2vw, 8px)',
    marginBottom: 'clamp(12px, 4vw, 20px)',
    width: '100%',
    boxSizing: 'border-box',
  },
  otpInput: {
    width: '100%',
    aspectRatio: '1 / 1',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 'clamp(8px, 2vw, 10px)',
    fontSize: 'clamp(16px, 4vw, 24px)',
    fontWeight: 700,
    color: '#e8e8ec',
    textAlign: 'center',
    outline: 'none',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transition: 'all 0.2s',
    cursor: 'text',
    boxSizing: 'border-box',
    minWidth: 0,
    padding: 'clamp(4px, 2vw, 8px)',
  },
  btn: {
    width: '100%',
    background: '#e8e8ec',
    color: '#14141a',
    border: 'none',
    borderRadius: 999,
    padding: 'clamp(10px, 3vw, 14px) 0',
    fontSize: 'clamp(13px, 3vw, 14px)',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transition: 'opacity 0.2s',
    marginBottom: 'clamp(12px, 4vw, 20px)',
    boxSizing: 'border-box',
  },
  error: {
    fontSize: 'clamp(11px, 2.5vw, 13px)',
    color: '#f87171',
    marginBottom: 'clamp(8px, 2vw, 12px)',
    textAlign: 'left',
    padding: 'clamp(6px, 2vw, 8px) clamp(8px, 2vw, 12px)',
    background: 'rgba(248, 113, 113, 0.1)',
    borderRadius: 6,
    border: '1px solid rgba(248, 113, 113, 0.2)',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    boxSizing: 'border-box',
  },
  success: {
    fontSize: 'clamp(11px, 2.5vw, 13px)',
    color: '#86efac',
    marginBottom: 'clamp(8px, 2vw, 12px)',
    textAlign: 'left',
    padding: 'clamp(6px, 2vw, 8px) clamp(8px, 2vw, 12px)',
    background: 'rgba(134, 239, 172, 0.1)',
    borderRadius: 6,
    border: '1px solid rgba(134, 239, 172, 0.2)',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    boxSizing: 'border-box',
  },
  timerSection: {
    width: '100%',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: 'clamp(12px, 4vw, 20px)',
    marginBottom: 'clamp(12px, 3vw, 16px)',
    boxSizing: 'border-box',
  },
  timerText: {
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    color: '#6b6b76',
    margin: '0 0 clamp(8px, 2vw, 12px)',
    wordBreak: 'break-word',
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: '#a78bfa',
    fontSize: 'clamp(11px, 2.5vw, 13px)',
    cursor: 'pointer',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    textDecoration: 'underline',
    padding: 'clamp(4px, 2vw, 6px)',
    wordBreak: 'break-word',
    boxSizing: 'border-box',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#6b6b76',
    fontSize: 'clamp(11px, 2.5vw, 13px)',
    marginTop: 'clamp(4px, 2vw, 8px)',
    cursor: 'pointer',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    textDecoration: 'underline',
    padding: 'clamp(4px, 2vw, 6px)',
    wordBreak: 'break-word',
    boxSizing: 'border-box',
  },
}

export default VerifyPage
