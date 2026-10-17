const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

function getStoredToken() {
  try {
    const raw = window.localStorage.getItem('verdant-session')
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed?.token || parsed?.accessToken || null
    }
  } catch {}
  return null
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getStoredToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, credentials: 'include' })
  const type = response.headers.get('content-type') || ''
  const body = type.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) throw new Error(body?.error || `Request failed (${response.status})`)
  return body
}

export const apiGet = (path) => request(path)
export const apiPost = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) })
export const API_URL = API_BASE_URL

export function connectLiveStream(onMessage, onStatus) {
  const token = getStoredToken()
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : ''
  const socket = new WebSocket(`${API_BASE_URL.replace(/^http/, 'ws')}${tokenQuery}`)
  socket.addEventListener('open', () => onStatus?.('connected'))
  socket.addEventListener('close', () => onStatus?.('disconnected'))
  socket.addEventListener('error', () => onStatus?.('error'))
  socket.addEventListener('message', (event) => {
    try { onMessage?.(JSON.parse(event.data)) } catch { /* Ignore malformed events. */ }
  })
  return () => socket.close()
}
