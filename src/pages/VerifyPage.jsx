import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export default function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuth()

  const email = location.state?.email || ''
  const name = location.state?.name || ''

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(600) // 10 minutes
  const [canResend, setCanResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const inputRefs = useRef([])

  useEffect(() => {
    if (!email) navigate('/signup', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (countdown <= 0) return setCanResend(true)
    const id = setInterval(() => setCountdown((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [countdown])

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus()
  }, [])

  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return
    const arr = otp.split('')
    arr[index] = value
    const next = arr.join('').slice(0, 6)
    setOtp(next)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    setOtp(text)
    if (text.length === 6) inputRefs.current[5]?.focus()
  }

  async function handleVerify(e) {
    e?.preventDefault()
    if (otp.length !== 6) return setError('Please enter a 6-digit code')
    setLoading(true); setError(''); setSuccess('')
    try {
      const payload = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code: otp }),
      })

      const user = payload.data?.user
      const token = payload.data?.token
      if (!user || !token) throw new Error(payload.message || 'Verification failed')

      setSuccess('Email verified — redirecting…')
      setSession(user, token)
      setTimeout(() => navigate('/events', { replace: true }), 500)
    } catch (err) {
      setError(err.message || 'Verification failed')
      setOtp('')
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email || resendLoading) return
    setResendLoading(true); setError(''); setSuccess('')
    try {
      const payload = await apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      })
      const debugCode = payload.data?.debugCode
      setSuccess(debugCode ? `New code sent (dev): ${debugCode}` : 'New code sent — check your inbox')
      setCountdown(600)
      setCanResend(false)
      setOtp('')
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div style={styles.shell}>
      <div style={styles.card}>
        <div style={styles.emoji}>✉</div>
        <h1 style={styles.title}>Check your email</h1>
        <p style={styles.sub}>We sent a 6-digit code to <strong style={{ color: '#e8e8ec' }}>{email}</strong></p>

        <form onSubmit={handleVerify} style={styles.form}>
          <div style={styles.otpContainer}>
            {[0,1,2,3,4,5].map((i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                placeholder="0"
                maxLength={1}
                value={otp[i] || ''}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
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
        </form>

        <div style={styles.timerSection}>
          <p style={styles.timerText}>Code expires in <strong>{formatTime(countdown)}</strong></p>
          <button type="button" onClick={handleResend} disabled={!canResend || resendLoading} style={{...styles.resendBtn, opacity: canResend ? 1 : 0.5}}>
            {resendLoading ? 'Sending…' : "Didn't get a code? Resend"}
          </button>
        </div>

        <button onClick={() => navigate('/signup', { replace: true })} style={styles.backBtn}>← Change email</button>
      </div>
    </div>
  )
}

const styles = {
  shell: {
    minHeight: '100vh',
    background: '#14141a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    padding: 'clamp(12px, 5vw, 24px)',
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
  },
  emoji: { fontSize: 'clamp(24px, 6vw, 32px)', marginBottom: 'clamp(8px, 3vw, 12px)' },
  title: { fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 700, color: '#f0f0f4', margin: 0 },
  sub: { fontSize: 'clamp(12px, 3.5vw, 14px)', color: '#6b6b76', margin: '12px 0 20px', lineHeight: 1.6 },
  form: { width: '100%' },
  otpContainer: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'clamp(4px, 2vw, 8px)', marginBottom: '12px' },
  otpInput: {
    width: '100%',
    aspectRatio: '1 / 1',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '8px',
    fontSize: 'clamp(16px, 4vw, 24px)',
    fontWeight: 700,
    color: '#e8e8ec',
    textAlign: 'center',
    outline: 'none',
    padding: '8px',
  },
  btn: { width: '100%', background: '#e8e8ec', color: '#14141a', border: 'none', borderRadius: 999, padding: '12px 0', fontWeight: 700, cursor: 'pointer', marginBottom: 12 },
  error: { color: '#f87171', marginBottom: 8, textAlign: 'left', width: '100%', padding: '6px 8px', background: 'rgba(248,113,113,0.06)', borderRadius: 6 },
  success: { color: '#86efac', marginBottom: 8, textAlign: 'left', width: '100%', padding: '6px 8px', background: 'rgba(134,239,172,0.06)', borderRadius: 6 },
  timerSection: { width: '100%', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, marginBottom: 12 },
  timerText: { color: '#6b6b76', margin: '0 0 8px' },
  resendBtn: { background: 'none', border: 'none', color: '#a78bfa', textDecoration: 'underline', padding: 6, cursor: 'pointer' },
  backBtn: { background: 'none', border: 'none', color: '#6b6b76', marginTop: 6, cursor: 'pointer', textDecoration: 'underline' },
}
