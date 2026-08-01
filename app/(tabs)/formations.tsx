import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { GraduationCap, FileText, Video, ClipboardCheck, Calendar, MapPin, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react-native'
import { useFocusEffect } from '@react-navigation/native'
import { router } from 'expo-router'
import { getMyTrainings } from '../../services/training.service'
import { EmptyView, ErrorView } from '../../components/UI'

const TYPE_ICONS: Record<string, any> = {
  QCM: FileText,
  LECTURE: FileText,
  VIDEO: Video,
  PRATIQUE: ClipboardCheck,
}

const TYPE_LABELS: Record<string, string> = {
  QCM: 'QCM',
  LECTURE: 'Lecture',
  VIDEO: 'Vidéo',
  PRATIQUE: 'Pratique',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon?: any }> = {
  ASSIGNEE: { label: 'À faire', color: 'bg-slate-100 text-slate-600' },
  EN_COURS: { label: 'En cours', color: 'bg-amber-100 text-amber-700', icon: Clock },
  TERMINE: { label: 'Terminé', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  REUSSI: { label: 'Réussi', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  ECHOUE: { label: 'Échoué', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function FormationsScreen() {
  const [trainings, setTrainings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getMyTrainings()
      setTrainings(data)
      setError(null)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => {
    setLoading(true)
    load()
  }, [load]))

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#f5b800" size="large" />
      </View>
    )
  }

  if (error) return <ErrorView message={error} />

  const pending = trainings.filter(t => t.status === 'ASSIGNEE' || t.status === 'EN_COURS')
  const completed = trainings.filter(t => t.status === 'TERMINE' || t.status === 'REUSSI' || t.status === 'ECHOUE')

  return (
    <ScrollView className="flex-1 bg-slate-50" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#f5b800" />}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-12 px-6 rounded-b-[40px] shadow-2xl"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Apprentissage</Text>
            <Text className="text-white font-black text-3xl mt-1">Formations</Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
            <GraduationCap size={24} color="#f5b800" />
          </View>
        </View>
      </LinearGradient>

      <View className="px-4 -mt-6">
        {trainings.length === 0 ? (
          <EmptyView message="Aucune formation assignée" />
        ) : (
          <View className="space-y-6 pb-8">
            {/* Pending */}
            {pending.length > 0 && (
              <View>
                <Text className="text-sm font-bold text-slate-700 mb-3">À compléter ({pending.length})</Text>
                <View className="space-y-3">
                  {pending.map((item: any) => {
                    const Icon = TYPE_ICONS[item.session.type] ?? FileText
                    const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.ASSIGNEE
                    return (
                      <TouchableOpacity
                        key={item.participantId}
                        onPress={() => router.push(`/formations/${item.session.id}`)}
                        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm active:opacity-70"
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-row items-center gap-2 flex-1">
                            <View className="w-10 h-10 bg-amber-100 rounded-xl items-center justify-center">
                              <Icon size={18} color="#f5b800" />
                            </View>
                            <View className="flex-1">
                              <Text className="font-bold text-slate-800 text-sm" numberOfLines={2}>{item.session.title}</Text>
                              <Text className="text-xs text-slate-400 mt-0.5">{TYPE_LABELS[item.session.type]}</Text>
                            </View>
                          </View>
                          <ChevronRight size={18} color="#94a3b8" />
                        </View>
                        {item.session.trainer && (
                          <Text className="text-xs text-slate-500 ml-12">Formateur: {item.session.trainer}</Text>
                        )}
                        <View className="flex-row items-center gap-2 mt-2 ml-12">
                          <View className={`px-2 py-0.5 rounded-full ${status.color}`}>
                            <Text className="text-xs font-medium">{status.label}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <View>
                <Text className="text-sm font-bold text-slate-700 mb-3">Historique ({completed.length})</Text>
                <View className="space-y-3">
                  {completed.map((item: any) => {
                    const Icon = TYPE_ICONS[item.session.type] ?? FileText
                    const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.TERMINE
                    return (
                      <TouchableOpacity
                        key={item.participantId}
                        onPress={() => router.push(`/formations/${item.session.id}`)}
                        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm active:opacity-70"
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-row items-center gap-2 flex-1">
                            <View className="w-10 h-10 bg-slate-100 rounded-xl items-center justify-center">
                              <Icon size={18} color="#64748b" />
                            </View>
                            <View className="flex-1">
                              <Text className="font-bold text-slate-800 text-sm" numberOfLines={2}>{item.session.title}</Text>
                              <Text className="text-xs text-slate-400 mt-0.5">{TYPE_LABELS[item.session.type]}</Text>
                            </View>
                          </View>
                          <ChevronRight size={18} color="#94a3b8" />
                        </View>
                        <View className="flex-row items-center gap-2 mt-2 ml-12">
                          <View className={`px-2 py-0.5 rounded-full ${status.color}`}>
                            <Text className="text-xs font-medium">{status.label}</Text>
                          </View>
                          {item.score != null && (
                            <Text className="text-xs font-bold text-slate-600">Score: {item.score}%</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  )
}
