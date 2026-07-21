import { api } from '../lib/api'

export async function getDailyReports(params?: { siteId?: string; state?: string; from?: string; to?: string }) {
  const { data } = await api.get('/daily-reports', { params })
  return data
}

export async function getDailyReport(id: string) {
  const { data } = await api.get(`/daily-reports/${id}`)
  return data
}

export async function createDailyReport(data: {
  siteId: string
  date?: string
  shift?: string
  contractId?: string
  chiefAgentId?: string
  agentsExpected?: number
  weather?: string
  visitorsCount?: number
  vehiclesInCount?: number
  vehiclesOutCount?: number
  roundsDone?: number
  summary?: string
  activities?: string
  handoverTo?: string
  keysCount?: number
  nextShiftNotes?: string
  submittedBy?: string
}) {
  const { data: res } = await api.post('/daily-reports', data)
  return res
}

export async function updateDailyReport(id: string, data: any) {
  const { data: res } = await api.patch(`/daily-reports/${id}`, data)
  return res
}

export async function addAgentToReport(reportId: string, agentId: string) {
  const { data } = await api.post(`/daily-reports/${reportId}/agents`, { agentId })
  return data
}

export async function removeAgentFromReport(reportId: string, agentId: string) {
  const { data } = await api.post(`/daily-reports/${reportId}/agents/${agentId}/remove`)
  return data
}

export async function submitReport(id: string) {
  const { data } = await api.post(`/daily-reports/${id}/submit`)
  return data
}

export async function validateReport(id: string) {
  const { data } = await api.post(`/daily-reports/${id}/validate`)
  return data
}

export async function rejectReport(id: string) {
  const { data } = await api.post(`/daily-reports/${id}/reject`)
  return data
}
