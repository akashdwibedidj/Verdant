import { apiPost } from './api.js'

export async function demoLogin({ email, password }) {
  const session = await apiPost('/api/auth/login', { email, password })
  const user = session.user || session
  if (session.token && !user.token) user.token = session.token
  return user
}

export async function demoSignUp({ name, workspace, email, password }) {
  const session = await apiPost('/api/auth/signup', { name, workspace, email, password })
  const user = session.user || session
  if (session.token && !user.token) user.token = session.token
  return user
}
