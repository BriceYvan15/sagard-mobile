import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput } from 'react-native'
import { Wrench, MapPin, Calendar, ChevronRight, X, Play, CheckCircle, Clock, Building2, Camera } from 'lucide-react-native'
import { useFocusEffect } from '@react-navigation/native'
import { getMyInterventions, startIntervention, completeIntervention } from '../../services/intervention.service'
import { EmptyView, ErrorView } from '../../components/UI'

const STATUS_COLORS: Record<string, string> = {
  PLANIFIEE: 'bg-blue-100 text-blue-700',
  ASSIGNEE: 'bg-amber-100 text-amber-700',
  EN_COURS: 'bg-orange-100 text-orange-700',
  TERMINEE: 'bg-green-100 text-green-700',
  ANNULEE: 'bg-red-100 text-red-700',
  REPORTER: 'bg-purple-100 text-purple-700',
}

const STATUS_LABELS: Record<string, string> = {
  PLANIFIEE: 'Planifiée',
  ASSIGNEE: 'Assignée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
  REPORTER: 'Reportée',
}

const TYPE_LABELS: Record<string, string> = {
  INSTALLATION_CAMERA: 'Installation Caméra',
  INSTALLATION_VIDEOSURVEILLANCE: 'Installation Vidéosurveillance',
  MAINTENANCE_CAMERA: 'Maintenance Caméra',
  MAINTENANCE_VIDEOSURVEILLANCE: 'Maintenance Vidéosurveillance',
  REPARATION: 'Réparation',
  AUDIT_TECHNIQUE: 'Audit Technique',
  AUTRE: 'Autre',
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function InterventionsScreen() {
  const [interventions, setInterventions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [filter, setFilter] = useState<string>('ALL')
  const [showComplete, setShowComplete] = useState(false)
  const [report, setReport] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useFocusEffect(useCallback(() => { loadInterventions() }, []))

  const loadInterventions = async () => {
    try {
      setError('')
      const data = await getMyInterventions()
      setInterventions(data)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur lors du chargement des interventions')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (id: string) => {
    setActionLoading(true)
    try {
      await startIntervention(id)
      await loadInterventions()
      const updated = interventions.find(i => i.id === id)
      if (updated) setSelected({ ...updated, status: 'EN_COURS' })
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erreur')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await completeIntervention(selected.id, { report })
      setShowComplete(false)
      setReport('')
      await loadInterventions()
      setSelected(null)
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erreur')
    } finally {
      setActionLoading(false)
    }
  }

  const filtered = filter === 'ALL' ? interventions : interventions.filter(i => i.status === filter)

  const FILTERS = ['ALL', 'ASSIGNEE', 'EN_COURS', 'TERMINEE']

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#f5b800" size="large" />
      </View>
    )
  }

  if (error) return <ErrorView message={error} />

  return (
    <>
      <ScrollView className="flex-1 bg-slate-50" refreshControl={<RefreshControl refreshing={false} onRefresh={loadInterventions} />}>
        <View className="px-4 pt-6 pb-3">
          <Text className="text-2xl font-bold text-slate-800">Interventions</Text>
          <Text className="text-slate-500 mt-1">Installations caméras & vidéosurveillance</Text>
        </View>

        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3">
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full mr-2 ${filter === f ? 'bg-amber-500' : 'bg-white border border-slate-200'}`}
            >
              <Text className={`text-sm font-medium ${filter === f ? 'text-white' : 'text-slate-600'}`}>
                {f === 'ALL' ? 'Toutes' : STATUS_LABELS[f] ?? f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <EmptyView message="Aucune intervention" />
        ) : (
          filtered.map((inv) => (
            <TouchableOpacity
              key={inv.id}
              onPress={() => setSelected(inv)}
              className="mx-4 mb-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-4"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 bg-amber-50 rounded-xl items-center justify-center mr-3">
                    <Wrench size={24} color="#f5b800" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-slate-800">{inv.title}</Text>
                    <Text className="text-xs text-slate-400 mt-0.5">{inv.reference}</Text>
                  </View>
                </View>
                <View className={`px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status] ?? 'bg-slate-100'}`}>
                  <Text className="text-xs font-medium">{STATUS_LABELS[inv.status] ?? inv.status}</Text>
                </View>
              </View>

              <View className="mt-3 space-y-1">
                <View className="flex-row items-center">
                  <Camera size={14} color="#94a3b8" />
                  <Text className="text-sm text-slate-500 ml-2">{TYPE_LABELS[inv.type] ?? inv.type}</Text>
                </View>
                {inv.site && (
                  <View className="flex-row items-center">
                    <MapPin size={14} color="#94a3b8" />
                    <Text className="text-sm text-slate-500 ml-2">{inv.site.name}</Text>
                  </View>
                )}
                <View className="flex-row items-center">
                  <Calendar size={14} color="#94a3b8" />
                  <Text className="text-sm text-slate-500 ml-2">{formatDate(inv.scheduledDate)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Detail modal */}
      <Modal visible={!!selected} animationType="slide" transparent={false}>
        <View className="flex-1 bg-slate-50">
          <View className="flex-row items-center justify-between px-4 pt-12 pb-3 bg-white border-b border-slate-100">
            <Text className="text-lg font-bold text-slate-800">Intervention</Text>
            <TouchableOpacity onPress={() => { setSelected(null); setShowComplete(false) }}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selected && (
            <ScrollView className="flex-1 px-4 pt-4">
              {/* Header card */}
              <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xl font-bold text-slate-800">{selected.title}</Text>
                  <View className={`px-3 py-1 rounded-full ${STATUS_COLORS[selected.status] ?? 'bg-slate-100'}`}>
                    <Text className="text-xs font-medium">{STATUS_LABELS[selected.status] ?? selected.status}</Text>
                  </View>
                </View>
                <Text className="text-sm text-slate-400 mt-1">{selected.reference}</Text>

                <View className="mt-4 space-y-2">
                  <View className="flex-row items-center">
                    <Camera size={16} color="#94a3b8" />
                    <Text className="text-sm text-slate-600 ml-2">{TYPE_LABELS[selected.type] ?? selected.type}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Calendar size={16} color="#94a3b8" />
                    <Text className="text-sm text-slate-600 ml-2">Planifiée: {formatDate(selected.scheduledDate)}</Text>
                  </View>
                  {selected.completedAt && (
                    <View className="flex-row items-center">
                      <CheckCircle size={16} color="#16a34a" />
                      <Text className="text-sm text-green-700 ml-2">Terminée: {formatDate(selected.completedAt)}</Text>
                    </View>
                  )}
                  {selected.priority && (
                    <View className="flex-row items-center">
                      <Clock size={16} color="#94a3b8" />
                      <Text className="text-sm text-slate-600 ml-2">Priorité: {selected.priority}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Description */}
              {selected.description && (
                <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
                  <Text className="text-base font-semibold text-slate-800 mb-2">Description</Text>
                  <Text className="text-sm text-slate-600">{selected.description}</Text>
                </View>
              )}

              {/* Site info */}
              {selected.site && (
                <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
                  <Text className="text-base font-semibold text-slate-800 mb-2">Site</Text>
                  <View className="flex-row items-center">
                    <Building2 size={16} color="#94a3b8" />
                    <Text className="text-sm text-slate-600 ml-2">{selected.site.name}</Text>
                  </View>
                  {selected.site.address && <Text className="text-sm text-slate-400 mt-1 ml-6">{selected.site.address}</Text>}
                </View>
              )}

              {/* Client info */}
              {selected.client && (
                <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
                  <Text className="text-base font-semibold text-slate-800 mb-2">Client</Text>
                  <Text className="text-sm text-slate-600">{selected.client.name}</Text>
                  {selected.client.phone && <Text className="text-sm text-slate-400 mt-1">{selected.client.phone}</Text>}
                </View>
              )}

              {/* Equipment */}
              {selected.equipmentList && (
                <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
                  <Text className="text-base font-semibold text-slate-800 mb-2">Équipements</Text>
                  <Text className="text-sm text-slate-600">{selected.equipmentList}</Text>
                </View>
              )}

              {/* Report */}
              {selected.report && (
                <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
                  <Text className="text-base font-semibold text-slate-800 mb-2">Rapport</Text>
                  <Text className="text-sm text-slate-600">{selected.report}</Text>
                </View>
              )}

              {/* Actions */}
              {selected.status === 'ASSIGNEE' && (
                <TouchableOpacity
                  onPress={() => handleStart(selected.id)}
                  disabled={actionLoading}
                  className="bg-amber-500 rounded-xl py-4 items-center mb-4"
                >
                  <View className="flex-row items-center">
                    <Play size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">{actionLoading ? 'Démarrage...' : 'Démarrer l\'intervention'}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {selected.status === 'EN_COURS' && (
                <TouchableOpacity
                  onPress={() => setShowComplete(true)}
                  className="bg-green-600 rounded-xl py-4 items-center mb-4"
                >
                  <View className="flex-row items-center">
                    <CheckCircle size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Terminer l'intervention</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Complete form */}
              {showComplete && (
                <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
                  <Text className="text-base font-semibold text-slate-800 mb-3">Rapport d'intervention</Text>
                  <TextInput
                    value={report}
                    onChangeText={setReport}
                    placeholder="Décrivez le travail effectué..."
                    multiline
                    numberOfLines={4}
                    className="border border-slate-200 rounded-xl p-3 text-sm text-slate-700 min-h-[100px]"
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    onPress={handleComplete}
                    disabled={actionLoading}
                    className="bg-green-600 rounded-xl py-3 items-center mt-3"
                  >
                    <Text className="text-white font-semibold">{actionLoading ? 'Envoi...' : 'Valider et terminer'}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View className="h-8" />
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  )
}
