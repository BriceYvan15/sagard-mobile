import { api } from '../lib/api'

export async function getMyInterventions() {
  const { data } = await api.get('/interventions')
  return data
}

export async function getInterventionDetail(id: string) {
  const { data } = await api.get(`/interventions/${id}`)
  return data
}

export async function startIntervention(id: string) {
  const { data } = await api.post(`/interventions/${id}/start`)
  return data
}

export async function completeIntervention(id: string, body: { report?: string; afterPhotos?: string[] }) {
  const { data } = await api.post(`/interventions/${id}/complete`, body)
  return data
}

export async function addBeforePhotos(id: string, photos: string[]) {
  const { data } = await api.post(`/interventions/${id}/before-photos`, { photos })
  return data
}
