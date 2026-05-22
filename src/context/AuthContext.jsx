import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest, clearSession as clearStoredSession, getStoredToken, getStoredUser, persistSession } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [token, setToken] = useState(() => getStoredToken())
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSession() {
      try {
        if (!token) {
          setAuthReady(true)
          return
        }

        const payload = await apiRequest('/auth/me')
        if (!active) return

        const nextUser = payload.data?.user || null
        if (nextUser) {
          setUser(nextUser)
          persistSession(nextUser, token)
        } else {
          clearStoredSession()
          setUser(null)
          setToken('')
        }
      } catch {
        if (!active) return
        clearStoredSession()
        setUser(null)
        setToken('')
      } finally {
        if (active) setAuthReady(true)
      }
    }

    loadSession()

    return () => {
      active = false
    }
  }, [token])

  const value = useMemo(() => ({
    user,
    token,
    authReady,
    isAuthenticated: Boolean(user && token),
    setSession(nextUser, nextToken) {
      setUser(nextUser)
      setToken(nextToken)
      persistSession(nextUser, nextToken)
    },
    clearSession() {
      clearStoredSession()
      setUser(null)
      setToken('')
    },
    async logout() {
      try {
        await apiRequest('/auth/logout', { method: 'POST' })
      } catch {
        // Always clear local session, even if the network call fails.
      } finally {
        clearStoredSession()
        setUser(null)
        setToken('')
      }
    },
  }), [authReady, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}