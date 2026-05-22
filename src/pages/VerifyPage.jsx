import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
 
function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email                 = location.state?.email || ''
  const [otp, setOtp]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const API_BASE = 'http://localhost:3333/api'
 
  async function handleVerify(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
 
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, otp }),
      })
      const payload = await res.json()

      if (!res.ok) throw new Error(payload.message || 'Invalid code')

      const user = payload.data?.user
      const token = payload.data?.token
      if (!user || !token) throw new Error('Missing authentication data')

      // ✅ Save user + token, then redirect
      localStorage.setItem('es_user', JSON.stringify(user))
      localStorage.setItem('es_token', token)
      navigate('/events', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
 
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
            required
            style={{ ...authInput, letterSpacing: '0.4em', textAlign: 'center', fontSize: 22 }}
          />
          {error && <p style={authError}>{error}</p>}
          <button type="submit" disabled={loading} style={authBtn}>
            {loading ? 'Verifying…' : 'Verify code →'}
          </button>
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