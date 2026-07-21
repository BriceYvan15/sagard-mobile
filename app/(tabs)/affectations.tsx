import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { MapPin, Building2, Clock, Calendar, ChevronRight, MapPinned, Info } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../lib/auth-context'
import { getMyDeployments } from '../../services/pointage.service'

export default function AffectationsScreen() {
  const { agentId } = useAuth()
  const [deployments, setDeployments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!agentId) { setLoading(false); return }
    ;(async () => {
      try {
        const data = await getMyDeployments(agentId)
        setDeployments(data)
      } catch (e) {
        console.error('Affectations error', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-12 px-6 rounded-b-[40px] shadow-2xl"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Mes sites</Text>
            <Text className="text-white font-black text-3xl mt-1">Affectations</Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
            <MapPinned size={24} color="#f5b800" />
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 -mt-8 mb-10">
        {loading ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200">
            <ActivityIndicator color="#f5b800" />
            <Text className="text-slate-400 font-medium mt-4">Chargement des sites...</Text>
          </View>
        ) : deployments.length === 0 ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200 border border-slate-100">
            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
              <MapPin size={40} color="#cbd5e1" />
            </View>
            <Text className="text-slate-900 font-bold text-lg text-center">Aucune affectation</Text>
            <Text className="text-slate-400 mt-2 text-center leading-5">
              Vous n'êtes actuellement assigné à aucun site. Contactez votre superviseur.
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {deployments.map((d: any) => (
              <TouchableOpacity
                key={d.id}
                activeOpacity={0.9}
                className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-3">
                      <View className="w-12 h-12 bg-sagard-yellow/10 rounded-2xl items-center justify-center">
                        <Building2 size={24} color="#d99e00" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 font-black text-lg leading-6" numberOfLines={1}>
                          {d.site?.name ?? 'Site non assigné'}
                        </Text>
                        <View className="flex-row items-center gap-1 mt-1">
                          <MapPin size={12} color="#94a3b8" />
                          <Text className="text-slate-400 text-xs font-bold uppercase tracking-tighter">
                            {d.site?.city ?? 'Localisation inconnue'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View className={`px-3 py-1.5 rounded-xl ${
                    d.state === 'ACTIF' ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${
                      d.state === 'ACTIF' ? 'text-green-700' : 'text-slate-500'
                    }`}>
                      {d.state}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-slate-50 my-5" />

                <View className="flex-row justify-between items-center">
                  <View className="flex-row gap-5">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 bg-slate-50 rounded-lg items-center justify-center">
                        <Clock size={14} color="#64748b" />
                      </View>
                      <View>
                        <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Vacation</Text>
                        <Text className="text-slate-700 font-bold text-xs capitalize">
                          {d.shiftKind === 'NUIT' ? 'Nuit' : d.shiftKind === 'JOUR' ? 'Jour' : d.shiftKind ?? '—'}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 bg-slate-50 rounded-lg items-center justify-center">
                        <Calendar size={14} color="#64748b" />
                      </View>
                      <View>
                        <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Depuis le</Text>
                        <Text className="text-slate-700 font-bold text-xs">
                          {d.startDate ? new Date(d.startDate).toLocaleDateString('fr-FR') : '—'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                    <ChevronRight size={18} color="#cbd5e1" />
                  </View>
                </View>

                {d.contract && (
                  <View className="mt-5 bg-slate-50 rounded-2xl px-4 py-3 flex-row items-center gap-2">
                    <Info size={14} color="#94a3b8" />
                    <Text className="text-slate-500 text-[11px] font-bold uppercase tracking-tight flex-1">
                      Contrat : {d.contract.reference ?? 'En attente'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}
