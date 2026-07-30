import { api } from '../lib/api'

export async function getMySites() {
  const { data } = await api.get('/client/sites')
  return data
}

export async function getMyInvoices() {
  const { data } = await api.get('/client/invoices')
  return data
}

export async function getInvoiceDetail(id: string) {
  const { data } = await api.get(`/client/invoices/${id}`)
  return data
}
