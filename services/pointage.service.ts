import { api } from '../lib/api'

// Pointage
export async function checkIn(data: {
  shift: string
  photoUrl: string
  latitude?: number
  longitude?: number
  siteId?: string
  deploymentId?: string
  notes?: string
  pointingMethod?: string
}) {
  const { data: res } = await api.post('/pointages/checkin', data)
  return res
}

export async function checkOut(pointageId: string, data: {
  photoUrl: string
  latitude?: number
  longitude?: number
  notes?: string
}) {
  const { data: res } = await api.post(`/pointages/${pointageId}/checkout`, data)
  return res
}

export async function updatePosition(pointageId: string, data: {
  latitude?: number
  longitude?: number
}) {
  const { data: res } = await api.patch(`/pointages/${pointageId}/position`, data)
  return res
}

export async function startBreak(pointageId: string) {
  const { data: res } = await api.post(`/pointages/${pointageId}/break-start`)
  return res
}

export async function endBreak(pointageId: string) {
  const { data: res } = await api.post(`/pointages/${pointageId}/break-end`)
  return res
}

export async function getTodayPointages(params?: { siteId?: string; shift?: string; agentId?: string }) {
  const { data } = await api.get('/pointages/today', { params })
  return data
}

export async function getMyPointages(agentId: string, startDate: string, endDate: string) {
  const { data } = await api.get(`/pointages/agent/${agentId}`, {
    params: { start: startDate, end: endDate },
  })
  return data
}

// Déploiements / Affectations
export async function getMyDeployments(agentId: string) {
  const { data } = await api.get('/deployments', { params: { agentId } })
  return data
}

// Paie
export async function getMyPayslips() {
  const { data } = await api.get('/hr/payrolls')
  return data
}

export async function getMyPayslip(lineId: string) {
  const { data } = await api.get(`/hr/payslip/${lineId}`)
  return data
}
