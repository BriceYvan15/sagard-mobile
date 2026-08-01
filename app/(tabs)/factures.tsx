import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FileText, Calendar, ChevronRight, X, Clock } from 'lucide-react-native'
import { useFocusEffect } from '@react-navigation/native'
import { getMyInvoices, getInvoiceDetail } from '../../services/client.service'
import { EmptyView, ErrorView } from '../../components/UI'

const STATUS_COLORS: Record<string, string> = {
  PAYEE: 'bg-green-100 text-green-700',
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  EN_RETARD: 'bg-red-100 text-red-700',
  ANNULEE: 'bg-slate-100 text-slate-500',
  BROUILLON: 'bg-slate-100 text-slate-500',
}

const STATUS_LABELS: Record<string, string> = {
  PAYEE: 'Payée',
  EN_ATTENTE: 'En attente',
  EN_RETARD: 'En retard',
  ANNULEE: 'Annulée',
  BROUILLON: 'Brouillon',
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAmount(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export default function FacturesScreen() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useFocusEffect(useCallback(() => { loadInvoices() }, []))

  const loadInvoices = async () => {
    try {
      setError('')
      const data = await getMyInvoices()
      setInvoices(data)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur lors du chargement des factures')
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const data = await getInvoiceDetail(id)
      setSelected(data)
    } catch {
      // ignore
    } finally {
      setDetailLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#f5b800" size="large" />
      </View>
    )
  }

  if (error) return <ErrorView message={error} />

  if (invoices.length === 0) return <EmptyView message="Aucune facture disponible" />

  return (
    <>
      <ScrollView className="flex-1 bg-slate-50" refreshControl={<RefreshControl refreshing={false} onRefresh={loadInvoices} tintColor="#f5b800" />}>
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          className="pt-16 pb-12 px-6 rounded-b-[40px] shadow-2xl"
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Comptabilité</Text>
              <Text className="text-white font-black text-3xl mt-1">Mes Factures</Text>
            </View>
            <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
              <FileText size={24} color="#f5b800" />
            </View>
          </View>
        </LinearGradient>

        <View className="px-4 -mt-6 pb-4">
          <Text className="text-slate-500 text-sm">{invoices.length} facture{invoices.length !== 1 ? 's' : ''}</Text>
        </View>

        {invoices.map((inv) => (
          <TouchableOpacity
            key={inv.id}
            onPress={() => openDetail(inv.id)}
            className="mx-4 mb-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex-row items-center"
          >
            <View className="w-12 h-12 bg-amber-50 rounded-xl items-center justify-center mr-3">
              <FileText size={24} color="#f5b800" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-slate-800">{inv.reference}</Text>
              <View className="flex-row items-center mt-1">
                <Calendar size={14} color="#94a3b8" />
                <Text className="text-sm text-slate-500 ml-1">{formatDate(inv.issueDate)}</Text>
              </View>
              <View className={`self-start mt-2 px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status] ?? 'bg-slate-100 text-slate-500'}`}>
                <Text className="text-xs font-medium">{STATUS_LABELS[inv.status] ?? inv.status}</Text>
              </View>
            </View>
            <View className="items-end mr-2">
              <Text className="text-base font-bold text-slate-800">{formatAmount(inv.totalAmount)}</Text>
            </View>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
        ))}

        <View className="h-8" />
      </ScrollView>

      {/* Invoice detail modal */}
      <Modal visible={!!selected} animationType="slide" transparent={false}>
        <View className="flex-1 bg-slate-50">
          <View className="flex-row items-center justify-between px-4 pt-12 pb-3 bg-white border-b border-slate-100">
            <Text className="text-lg font-bold text-slate-800">Détail Facture</Text>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {detailLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#f5b800" size="large" />
            </View>
          ) : selected ? (
            <ScrollView className="flex-1 px-4 pt-4">
              <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
                <Text className="text-xl font-bold text-slate-800">{selected.reference}</Text>
                <View className={`self-start mt-2 px-3 py-1 rounded-full ${STATUS_COLORS[selected.status] ?? 'bg-slate-100'}`}>
                  <Text className={`text-xs font-medium ${STATUS_COLORS[selected.status]?.replace('bg-', 'text-') ?? 'text-slate-500'}`}>
                    {STATUS_LABELS[selected.status] ?? selected.status}
                  </Text>
                </View>

                <View className="mt-4 space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-slate-500">Date d'émission</Text>
                    <Text className="text-slate-800 font-medium">{formatDate(selected.issueDate)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-500">Échéance</Text>
                    <Text className="text-slate-800 font-medium">{formatDate(selected.dueDate)}</Text>
                  </View>
                  {selected.paidAt && (
                    <View className="flex-row justify-between">
                      <Text className="text-slate-500">Payée le</Text>
                      <Text className="text-green-700 font-medium">{formatDate(selected.paidAt)}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Lines */}
              {selected.lines?.length > 0 && (
                <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
                  <Text className="text-base font-semibold text-slate-800 mb-3">Détails</Text>
                  {selected.lines.map((line: any, i: number) => (
                    <View key={line.id ?? i} className="py-2 border-b border-slate-50">
                      <Text className="text-sm text-slate-700">{line.description}</Text>
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-xs text-slate-400">Qté: {line.quantity}</Text>
                        <Text className="text-sm font-medium text-slate-800">{formatAmount(line.total)}</Text>
                      </View>
                    </View>
                  ))}
                  <View className="flex-row justify-between pt-3">
                    <Text className="text-base font-bold text-slate-800">Total</Text>
                    <Text className="text-base font-bold text-amber-600">{formatAmount(selected.totalAmount)}</Text>
                  </View>
                </View>
              )}

              {/* Client info */}
              {selected.client && (
                <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
                  <Text className="text-base font-semibold text-slate-800 mb-2">Client</Text>
                  <Text className="text-sm text-slate-600">{selected.client.name}</Text>
                  {selected.client.address && <Text className="text-sm text-slate-400 mt-1">{selected.client.address}</Text>}
                  {selected.client.phone && <Text className="text-sm text-slate-400">{selected.client.phone}</Text>}
                </View>
              )}

              <View className="h-8" />
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </>
  )
}
