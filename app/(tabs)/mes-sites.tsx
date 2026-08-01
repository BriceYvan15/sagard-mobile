import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Building2, MapPin, Users, CircleCheck, Circle, Phone, ChevronDown, ChevronUp } from 'lucide-react-native'
import { useFocusEffect } from '@react-navigation/native'
import { getMySites } from '../../services/client.service'
import { EmptyView, ErrorView } from '../../components/UI'

export default function MesSitesScreen() {
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useFocusEffect(useCallback(() => { loadSites() }, []))

  const loadSites = async () => {
    try {
      setError('')
      const data = await getMySites()
      setSites(data)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur lors du chargement des sites')
    } finally {
      setLoading(false)
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

  if (sites.length === 0) return <EmptyView message="Aucun site assigné pour le moment" />

  return (
    <ScrollView className="flex-1 bg-slate-50" refreshControl={<RefreshControl refreshing={false} onRefresh={loadSites} tintColor="#f5b800" />}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-12 px-6 rounded-b-[40px] shadow-2xl"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Gardiennage</Text>
            <Text className="text-white font-black text-3xl mt-1">Mes Sites</Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
            <Building2 size={24} color="#f5b800" />
          </View>
        </View>
      </LinearGradient>

      <View className="px-4 -mt-6 pb-4">
        <Text className="text-slate-500 text-sm">Agents assignés et statut en poste</Text>
      </View>

      {sites.map((site) => (
        <View key={site.id} className="mx-4 mb-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <TouchableOpacity
            onPress={() => setExpandedId(expandedId === site.id ? null : site.id)}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-amber-50 rounded-xl items-center justify-center mr-3">
                <Building2 size={24} color="#f5b800" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-800">{site.name}</Text>
                <View className="flex-row items-center mt-1">
                  <MapPin size={14} color="#94a3b8" />
                  <Text className="text-sm text-slate-500 ml-1">{site.address ?? site.city ?? '—'}</Text>
                </View>
              </View>
            </View>
            {expandedId === site.id ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
          </TouchableOpacity>

          {/* Stats row */}
          <View className="flex-row px-4 pb-3 gap-3">
            <View className="flex-1 bg-slate-50 rounded-lg py-2 px-3 flex-row items-center">
              <Users size={16} color="#64748b" />
              <Text className="text-sm text-slate-600 ml-2">{site.agentsAssigned} agent{site.agentsAssigned !== 1 ? 's' : ''}</Text>
            </View>
            <View className={`flex-1 rounded-lg py-2 px-3 flex-row items-center ${site.agentsOnPost > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              {site.agentsOnPost > 0 ? <CircleCheck size={16} color="#16a34a" /> : <Circle size={16} color="#dc2626" />}
              <Text className={`text-sm ml-2 ${site.agentsOnPost > 0 ? 'text-green-700' : 'text-red-600'}`}>
                {site.agentsOnPost} en poste
              </Text>
            </View>
          </View>

          {/* Expanded agents list */}
          {expandedId === site.id && (
            <View className="px-4 pb-4 border-t border-slate-100 pt-3">
              {site.agents?.length === 0 ? (
                <Text className="text-sm text-slate-400 text-center py-2">Aucun agent assigné</Text>
              ) : (
                site.agents?.map((agent: any) => (
                  <View key={agent.id} className="flex-row items-center py-2.5 border-b border-slate-50">
                    <View className={`w-3 h-3 rounded-full mr-3 ${agent.onPost ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-slate-700">
                        {agent.firstName} {agent.lastName}
                      </Text>
                      <Text className="text-xs text-slate-400">Mat: {agent.matricule} · {agent.shift}</Text>
                    </View>
                    {agent.phone && (
                      <TouchableOpacity onPress={() => {}}>
                        <Phone size={18} color="#94a3b8" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      ))}

      <View className="h-8" />
    </ScrollView>
  )
}
