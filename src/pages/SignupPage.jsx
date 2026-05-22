import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SignupPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const navigate = useNavigate()
  const API_BASE = 'http://localhost:3333/api'

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const payload = await res.json()

      if (!res.ok) throw new Error(payload.message || 'Something went wrong')

      // pass email to VerifyPage via router state
      navigate('/verify', { state: { email } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.shell}>
      <div style={styles.card}>

        <div style={styles.logo}>✦</div>
        <h1 style={styles.title}>Sign in to EventSphere</h1>
        <p style={styles.sub}>Enter your email to receive a one-time code.</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Sending…' : 'Continue with email →'}
          </button>
        </form>

      </div>
    </div>
  )
}

/* ── styles ── */
const styles = {
  shell: {
    minHeight: '100vh',
    background: '#14141a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    padding: 24,
  },
  card: {
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
  },
  logo: {
    fontSize: 28,
    color: '#a78bfa',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#f0f0f4',
    marginBottom: 8,
    letterSpacing: '-0.3px',
  },
  sub: {
    fontSize: 14,
    color: '#6b6b76',
    marginBottom: 28,
    lineHeight: 1.6,
  },
  input: {
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
  },
  btn: {
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
    transition: 'opacity 0.15s',
  },
  error: {
    fontSize: 12.5,
    color: '#f87171',
    marginBottom: 8,
    textAlign: 'left',
  },
}
