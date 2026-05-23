import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
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
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
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
    } finally {
      setResendLoading(false)
    }
  }

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
