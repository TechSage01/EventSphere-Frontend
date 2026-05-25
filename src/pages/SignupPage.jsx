import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function SignupPage() {
<<<<<<< HEAD
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const navigate = useNavigate()
  const API_BASE = import.meta.env.VITE_API_URL || 'https://eventsphere-backend-swqw.onrender.com/api'
=======
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/events', { replace: true })
    return null
  }

  const [formData, setFormData] = useState({ name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
>>>>>>> 8fdb0489db2cb10ce1b6f539fe19613f2976eb8b

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { name, email } = formData
    if (!name.trim()) {
      setError('Full name is required')
      setLoading(false)
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required')
      setLoading(false)
      return
    }

    try {
<<<<<<< HEAD
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, name }),
=======
      const payload = await apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
>>>>>>> 8fdb0489db2cb10ce1b6f539fe19613f2976eb8b
      })

<<<<<<< HEAD
      if (!res.ok) throw new Error(data.message || 'Something went wrong')

      // pass email + name to VerifyPage via router state
      // persist pending values in case user refreshes the verify page
      try { localStorage.setItem('es_pending_email', email); localStorage.setItem('es_pending_name', name) } catch {}
      navigate('/verify', { state: { email, name } })
=======
      const debugCode = payload.data?.debugCode
      setSuccess(
        debugCode
          ? `${payload.message || 'Verification code sent.'} Dev code: ${debugCode}`
          : payload.message || 'Check your inbox for the verification code.'
      )
      
      // Redirect to verify page with email and name
      setTimeout(() => {
        navigate('/verify', { 
          state: { email: email.trim(), name: name.trim() },
          replace: true 
        })
      }, 800)
>>>>>>> 8fdb0489db2cb10ce1b6f539fe19613f2976eb8b
    } catch (err) {
      setError(err.message || 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.shell}>
      <div style={styles.card}>
        <div style={styles.logo}>✦</div>
<<<<<<< HEAD
        <h1 style={styles.title}>Sign in to EventsNest</h1>
        <p style={styles.sub}>Enter your name and email to receive a one-time code.</p>
=======
        <h1 style={styles.title}>Create your EventSphere account</h1>
        <p style={styles.sub}>Sign up with your email to get started</p>
>>>>>>> 8fdb0489db2cb10ce1b6f539fe19613f2976eb8b

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <input
            type="text"
<<<<<<< HEAD
            placeholder="Your full name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
=======
            name="name"
            placeholder="Your full name"
            value={formData.name}
            onChange={handleChange}
>>>>>>> 8fdb0489db2cb10ce1b6f539fe19613f2976eb8b
            required
            disabled={loading}
            style={styles.input}
          />
          
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ ...styles.input, marginBottom: 12 }}
          />

          {success && <p style={styles.success}>{success}</p>}
          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Sending verification code…' : 'Continue →'}
          </button>
        </form>

        <p style={styles.footer}>
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
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
    transition: 'border-color 0.2s',
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
    transition: 'opacity 0.2s',
  },
  error: {
    fontSize: 12.5,
    color: '#f87171',
    marginBottom: 12,
    textAlign: 'left',
    padding: '8px 12px',
    background: 'rgba(248, 113, 113, 0.1)',
    borderRadius: 6,
    border: '1px solid rgba(248, 113, 113, 0.2)',
  },
  success: {
    fontSize: 12.5,
    color: '#86efac',
    marginBottom: 12,
    textAlign: 'left',
    padding: '8px 12px',
    background: 'rgba(134, 239, 172, 0.1)',
    borderRadius: 6,
    border: '1px solid rgba(134, 239, 172, 0.2)',
  },
  footer: {
    fontSize: 11,
    color: '#6b6b76',
    marginTop: 20,
    lineHeight: 1.5,
  },
}
