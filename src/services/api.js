const DEFAULT_API_BASE = '/api'

export function getApiBaseUrl() {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    DEFAULT_API_BASE
  ).replace(/\/$/, '')
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('es_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getStoredToken() {
  return localStorage.getItem('es_token') || ''
}

export function persistSession(user, token) {
  if (user) {
    localStorage.setItem('es_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('es_user')
  }

  if (token) {
    localStorage.setItem('es_token', token)
  } else {
    localStorage.removeItem('es_token')
  }
}

export function clearSession() {
  localStorage.removeItem('es_user')
  localStorage.removeItem('es_token')
}

async function readResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    return text ? { message: text } : {}
  }

  try {
    return await response.json()
  } catch {
    return {}
  }
}

export async function apiRequest(path, options = {}) {
  const baseUrl = getApiBaseUrl()
  const token = getStoredToken()
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers,
  })

  const payload = await readResponse(response)

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Request failed')
  }

  return payload
}