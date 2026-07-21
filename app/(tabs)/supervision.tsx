import { useState, useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native'
import {
  LayoutDashboard, Users, AlertTriangle,
  CheckCircle, Clock, XCircle
} from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { getTodayPointages } from '../../services/pointage.service'
import { getIncidents } from '../../services/incident.service'

export default function SupervisionScreen() {
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    termines: 0,
    retards: 0,
    absents: 0,
  })
  const [incidents, setIncidents] = useState<any[]>([])
  const [pointages, setPointages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ptData, incData] = await Promise.all([
        getTodayPointages(),
        getIncidents({ state: 'OUVERT' }),
      ])
      setPointages(ptData)
      setIncidents(incData)
      setStats({
        total: ptData.length,
        enCours: ptData.filter((p: any) => p.status === 'EN_COURS').length,
        termines: ptData.filter((p: any) => p.status === 'TERMINE').length,
        retards: ptData.filter((p: any) => p.status === 'RETARD').length,
        absents: ptData.filter((p: any) => p.status === 'ABSENT').length,
      })
    } catch (e) {
      console.error('Supervision error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const statusColors: Record<string, string> = {
    EN_COURS: 'bg-blue-100 text-blue-700',
    TERMINE: 'bg-green-100 text-green-700',
    RETARD: 'bg-amber-100 text-amber-700',
    ABSENT: 'bg-red-100 text-red-700',
    PRESENT: 'bg-green-100 text-green-700',
  }

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator color="#f5b800" size="large" />
      </View>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f5b800" />}
    >
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-12 px-6 rounded-b-[40px] shadow-2xl"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Vue d'ensemble</Text>
            <Text className="text-white font-black text-3xl mt-1">Supervision</Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
            <LayoutDashboard size={24} color="#f5b800" />
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 -mt-8 mb-10">
        {/* Stats grid */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <View className="flex-1 min-w-[47%] bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between mb-2">
              <View className="w-10 h-10 bg-blue-100 rounded-2xl items-center justify-center">
                <Users size={18} color="#3b82f6" />
              </View>
              <Text className="text-slate-900 font-black text-2xl">{stats.total}</Text>
            </View>
            <Text className="text-slate-400 text-xs font-bold uppercase">Total pointages</Text>
          </View>

          <View className="flex-1 min-w-[47%] bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between mb-2">
              <View className="w-10 h-10 bg-green-100 rounded-2xl items-center justify-center">
                <CheckCircle size={18} color="#22c55e" />
              </View>
              <Text className="text-slate-900 font-black text-2xl">{stats.termines}</Text>
            </View>
            <Text className="text-slate-400 text-xs font-bold uppercase">Terminés</Text>
          </View>

          <View className="flex-1 min-w-[47%] bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between mb-2">
              <View className="w-10 h-10 bg-amber-100 rounded-2xl items-center justify-center">
                <Clock size={18} color="#f59e0b" />
              </View>
              <Text className="text-slate-900 font-black text-2xl">{stats.retards}</Text>
            </View>
            <Text className="text-slate-400 text-xs font-bold uppercase">Retards</Text>
          </View>

          <View className="flex-1 min-w-[47%] bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between mb-2">
              <View className="w-10 h-10 bg-red-100 rounded-2xl items-center justify-center">
                <XCircle size={18} color="#ef4444" />
              </View>
              <Text className="text-slate-900 font-black text-2xl">{stats.absents}</Text>
            </View>
            <Text className="text-slate-400 text-xs font-bold uppercase">Absents</Text>
          </View>
        </View>

        {/* Open incidents */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px]">Incidents ouverts</Text>
          <View className="bg-red-100 px-2.5 py-1 rounded-lg">
            <Text className="text-red-700 text-[10px] font-black">{incidents.length}</Text>
          </View>
        </View>

        {incidents.length === 0 ? (
          <View className="bg-white rounded-[24px] p-6 items-center shadow-sm border border-slate-100 mb-6">
            <CheckCircle size={32} color="#22c55e" />
            <Text className="text-slate-500 font-bold text-sm mt-2">Aucun incident ouvert</Text>
          </View>
        ) : (
          <View className="space-y-2 mb-6">
            {incidents.slice(0, 5).map((inc: any) => (
              <View key={inc.id} className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex-row items-center gap-3">
                <View className="w-10 h-10 bg-red-100 rounded-2xl items-center justify-center">
                  <AlertTriangle size={18} color="#ef4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>{inc.title}</Text>
                  <Text className="text-slate-400 text-xs">{inc.site?.name ?? '—'}</Text>
                </View>
                <View className="px-2 py-1 rounded-lg bg-red-50">
                  <Text className="text-red-600 text-[9px] font-black uppercase">{inc.severity}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Today's pointages */}
        <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Pointages du jour</Text>

        {pointages.length === 0 ? (
          <View className="bg-white rounded-[24px] p-6 items-center shadow-sm border border-slate-100">
            <Users size={32} color="#cbd5e1" />
            <Text className="text-slate-500 font-bold text-sm mt-2">Aucun pointage aujourd'hui</Text>
          </View>
        ) : (
          <View className="space-y-2">
            {pointages.slice(0, 20).map((p: any) => (
              <View key={p.id} className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex-row items-center gap-3">
                <View className="w-10 h-10 bg-sagard-yellow/10 rounded-2xl items-center justify-center">
                  <Users size={16} color="#d99e00" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-bold text-sm">
                    {p.agent?.user?.firstName} {p.agent?.user?.lastName}
                  </Text>
                  <Text className="text-slate-400 text-xs">
                    {p.agent?.matricule} · {p.deployment?.site?.name ?? '—'}
                  </Text>
                </View>
                <View className={`px-2.5 py-1 rounded-lg ${statusColors[p.status] ?? 'bg-slate-100'}`}>
                  <Text className="text-[9px] font-black uppercase">{p.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}
