import { api } from '../lib/api'

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  const token = data.token ?? data.access_token ?? data.accessToken
  const user = data.user ?? data
  return { token, user } as { token: string; user: any }
}

export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data
}
