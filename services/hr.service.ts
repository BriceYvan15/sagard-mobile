import { api } from '../lib/api'

// Paie
export async function getPayrolls(params?: { month?: number; year?: number; agentId?: string }) {
  const { data } = await api.get('/hr/payrolls', { params })
  return data
}

export async function getPayslip(id: string) {
  const { data } = await api.get(`/hr/payslip/${id}`)
  return data
}

export async function getPayrollDetail(id: string) {
  const { data } = await api.get(`/hr/payrolls/${id}/detail`)
  return data
}

// Congés
export async function getLeaves(params?: { agentId?: string; status?: string }) {
  const { data } = await api.get('/hr/leaves', { params })
  return data
}

export async function requestLeave(data: {
  agentId: string
  type: string
  startDate: string
  endDate: string
  days: number
  reason?: string
}) {
  const { data: res } = await api.post('/hr/leaves', data)
  return res
}

// Formations
export async function getTrainings(agentId?: string) {
  const { data } = await api.get('/hr/trainings', { params: { agentId } })
  return data
}

// Auth
export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword })
  return data
}
