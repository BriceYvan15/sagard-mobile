import { api } from '../lib/api'

export async function getPatrols(params?: { siteId?: string; agentId?: string; state?: string; from?: string; to?: string }) {
  const { data } = await api.get('/patrols', { params })
  return data
}

export async function getPatrol(id: string) {
  const { data } = await api.get(`/patrols/${id}`)
  return data
}

export async function startPatrol(body: { siteId: string; agentId: string; notes?: string }) {
  const { data } = await api.post('/patrols/start', body)
  return data
}

export async function scanPatrolPoint(roundId: string, body: {
  pointCode?: string
  pointId?: string
  latitude?: number
  longitude?: number
  photoUrl?: string
  note?: string
  hasAnomaly?: boolean
}) {
  const { data } = await api.post(`/patrols/${roundId}/scan`, body)
  return data
}

export async function completePatrol(roundId: string) {
  const { data } = await api.post(`/patrols/${roundId}/complete`)
  return data
}

export async function abortPatrol(roundId: string) {
  const { data } = await api.post(`/patrols/${roundId}/abort`)
  return data
}
