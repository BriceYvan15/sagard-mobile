import { api } from '../lib/api'

export async function getKeys(siteId?: string) {
  const { data } = await api.get('/keys', { params: { siteId } })
  return data
}

export async function getKey(id: string) {
  const { data } = await api.get(`/keys/${id}`)
  return data
}

export async function issueKey(keyId: string, data: { employeeId?: string; visitorLogId?: string; issuedById?: string; notes?: string }) {
  const { data: res } = await api.post(`/keys/${keyId}/issue`, data)
  return res
}

export async function returnKey(keyId: string, data: { notes?: string }) {
  const { data: res } = await api.post(`/keys/${keyId}/return`, data)
  return res
}

export async function declareKeyLost(keyId: string, data: { notes?: string }) {
  const { data: res } = await api.post(`/keys/${keyId}/lost`, data)
  return res
}

export async function getKeyMovements(keyId: string) {
  const { data } = await api.get(`/keys/${keyId}/movements`)
  return data
}
