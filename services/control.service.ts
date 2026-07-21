import { api } from '../lib/api'

export async function getControls(params?: { siteId?: string; controllerId?: string; state?: string; visitType?: string; from?: string; to?: string }) {
  const { data } = await api.get('/controls', { params })
  return data
}

export async function getSiteAgents(siteId: string) {
  const { data } = await api.get('/deployments', { params: { siteId, state: 'ACTIF' } })
  return data
}

export async function getControl(id: string) {
  const { data } = await api.get(`/controls/${id}`)
  return data
}

export async function createControl(data: {
  controllerId: string
  siteId: string
  contractId?: string
  visitDatetime?: string
  visitType?: string
  agentsExpected?: number
  observations?: string
  notes?: string
}) {
  const { data: res } = await api.post('/controls', data)
  return res
}

export async function updateControl(id: string, data: any) {
  const { data: res } = await api.patch(`/controls/${id}`, data)
  return res
}

export async function markControlDone(id: string) {
  const { data } = await api.post(`/controls/${id}/done`)
  return data
}

export async function markControlReported(id: string) {
  const { data } = await api.post(`/controls/${id}/reported`)
  return data
}

export async function cancelControl(id: string) {
  const { data } = await api.post(`/controls/${id}/cancel`)
  return data
}
