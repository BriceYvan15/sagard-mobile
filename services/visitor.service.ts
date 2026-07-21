import { api } from '../lib/api'

export async function getSites() {
  const { data } = await api.get('/sites')
  return data
}

export async function getVisitors(siteId?: string) {
  const { data } = await api.get('/visitors', { params: { siteId } })
  return data
}

export async function getVisitor(id: string) {
  const { data } = await api.get(`/visitors/${id}`)
  return data
}

export async function checkOutVisitor(id: string) {
  const { data } = await api.post(`/visitors/${id}/checkout`)
  return data
}

export async function createVisitor(data: {
  siteId: string
  visitorName: string
  visitorCompany?: string
  visitorPhone?: string
  idType?: string
  idNumber?: string
  visitPurpose?: string
  hostName?: string
  plateNumber?: string
  badgeNo?: string
  photoUrl?: string
  notes?: string
  agentId?: string
}) {
  const { data: res } = await api.post('/visitors', data)
  return res
}

export async function getBlacklist(siteId?: string) {
  const { data } = await api.get('/visitors/blacklist', { params: { siteId } })
  return data
}
