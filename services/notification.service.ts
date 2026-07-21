import { api } from '../lib/api'

export async function getNotifications(params?: { agentId?: string; userId?: string }) {
  const { data } = await api.get('/notifications', { params })
  return data
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch(`/notifications/${id}/read`)
  return data
}

export async function getUnreadCount(params?: { agentId?: string; userId?: string }) {
  const { data } = await api.get('/notifications/unread-count', { params })
  return data
}
