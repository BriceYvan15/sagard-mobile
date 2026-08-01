import { api } from '../lib/api'

export async function getMyTrainings() {
  const { data } = await api.get('/trainings/my-trainings')
  return data
}

export async function getTrainingDetail(sessionId: string) {
  const { data } = await api.get(`/trainings/my-trainings/${sessionId}`)
  return data
}

export async function submitTraining(sessionId: string, payload: {
  answers?: { questionId: string; selectedIndex: number }[]
}) {
  const { data } = await api.post(`/trainings/my-trainings/${sessionId}/submit`, payload)
  return data
}
