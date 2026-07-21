import { api } from '../lib/api'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

export async function getIncidents(params?: { siteId?: string; state?: string; severity?: string; incidentType?: string; from?: string; to?: string }) {
  const { data } = await api.get('/incidents', { params })
  return data
}

export async function getIncident(id: string) {
  const { data } = await api.get(`/incidents/${id}`)
  return data
}

export async function createIncident(data: {
  title: string
  siteId: string
  incidentType: string
  severity?: string
  description: string
  actionsTaken?: string
  policeCalled?: boolean
  clientNotified?: boolean
  estimatedDamage?: number
  attachmentUrls?: string[]
  reporterId?: string
}) {
  const { data: res } = await api.post('/incidents', data)
  return res
}

export async function uploadIncidentPhoto(incidentId: string, fileUri: string, fileName: string, mimeType: string) {
  const formData = new FormData()
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any)

  const token = Platform.OS === 'web'
    ? localStorage.getItem('sagard_token')
    : await SecureStore.getItemAsync('sagard_token')

  const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'https://sagard.opriel.com/api/v1'

  const res = await fetch(`${baseURL}/incidents/${incidentId}/photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
}

export async function updateIncident(id: string, data: any) {
  const { data: res } = await api.patch(`/incidents/${id}`, data)
  return res
}

export async function investigateIncident(id: string) {
  const { data } = await api.post(`/incidents/${id}/investigate`)
  return data
}

export async function resolveIncident(id: string, resolution?: string) {
  const { data } = await api.post(`/incidents/${id}/resolve`, { resolution })
  return data
}

export async function closeIncident(id: string) {
  const { data } = await api.post(`/incidents/${id}/close`)
  return data
}
