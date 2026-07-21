import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native'
import {
  Key as KeyIcon, X, MapPin, ArrowDownToLine, ArrowUpFromLine,
  AlertCircle, Clock
} from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../lib/auth-context'
import { getKeys, issueKey, returnKey, declareKeyLost, getKeyMovements } from '../../services/key.service'
import { getMyDeployments } from '../../services/pointage.service'

const KEY_STATES: Record<string, { label: string; color: string }> = {
  DISPONIBLE: { label: 'Disponible', color: 'bg-green-100 text-green-700' },
  SORTIE: { label: 'Sortie', color: 'bg-amber-100 text-amber-700' },
  PERDUE: { label: 'Perdue', color: 'bg-red-100 text-red-700' },
}

export default function ClesScreen() {
  const { agentId } = useAuth()
  const [keys, setKeys] = useState<any[]>([])
  const [deployments, setDeployments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState<any | null>(null)
  const [movements, setMovements] = useState<any[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueTo, setIssueTo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!agentId) { setLoading(false); return }
    try {
      const [keyData, depData] = await Promise.all([
        getKeys(),
        getMyDeployments(agentId),
      ])
      const siteIds = depData.filter((d: any) => d.state === 'ACTIF').map((d: any) => d.siteId)
      const filtered = keyData.filter((k: any) => siteIds.length === 0 || siteIds.includes(k.siteId))
      setKeys(filtered)
      setDeployments(depData.filter((d: any) => d.state === 'ACTIF'))
    } catch (e) {
      console.error('Keys error', e)
    } finally {
      setLoading(false)
    }
  }

  const loadMovements = async (keyId: string) => {
    setMovementsLoading(true)
    try {
      const data = await getKeyMovements(keyId)
      setMovements(data)
    } catch {
      setMovements([])
    } finally {
      setMovementsLoading(false)
    }
  }

  const handleSelectKey = (key: any) => {
    setSelectedKey(key)
    loadMovements(key.id)
  }

  const handleIssue = async () => {
    if (!selectedKey || !issueTo) {
      Alert.alert('Champ requis', 'Indiquez à qui la clé est remise')
      return
    }
    setSubmitting(true)
    try {
      await issueKey(selectedKey.id, {
        employeeId: issueTo,
        issuedById: agentId ?? undefined,
      })
      setShowIssueModal(false)
      setIssueTo('')
      loadData()
      Alert.alert('Succès', 'Clé remise')
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message ?? 'Impossible de remettre la clé')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturn = async () => {
    if (!selectedKey) return
    Alert.alert('Retour de clé', 'Confirmer le retour de cette clé?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          try {
            await returnKey(selectedKey.id, {})
            loadData()
            const updated = { ...selectedKey, state: 'DISPONIBLE' }
            setSelectedKey(updated)
            loadMovements(selectedKey.id)
            Alert.alert('Succès', 'Clé retournée')
          } catch {
            Alert.alert('Erreur', 'Impossible d\'enregistrer le retour')
          }
        },
      },
    ])
  }

  const handleLost = async () => {
    if (!selectedKey) return
    Alert.alert('Perte de clé', 'Déclarer cette clé comme perdue?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déclarer perdue',
        style: 'destructive',
        onPress: async () => {
          try {
            await declareKeyLost(selectedKey.id, {})
            loadData()
            setSelectedKey(null)
            Alert.alert('Succès', 'Clé déclarée perdue')
          } catch {
            Alert.alert('Erreur', 'Impossible de déclarer la perte')
          }
        },
      },
    ])
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-12 px-6 rounded-b-[40px] shadow-2xl"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Trousseau</Text>
            <Text className="text-white font-black text-3xl mt-1">Clés</Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
            <KeyIcon size={24} color="#f5b800" />
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 -mt-8 mb-10">
        {loading ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200">
            <ActivityIndicator color="#f5b800" />
            <Text className="text-slate-400 font-medium mt-4">Chargement...</Text>
          </View>
        ) : keys.length === 0 ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200 border border-slate-100">
            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
              <KeyIcon size={40} color="#cbd5e1" />
            </View>
            <Text className="text-slate-900 font-bold text-lg text-center">Aucune clé</Text>
            <Text className="text-slate-400 mt-2 text-center leading-5">
              Aucune clé enregistrée pour vos sites.
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {keys.map((k: any) => {
              const state = KEY_STATES[k.state] ?? KEY_STATES.DISPONIBLE
              return (
                <TouchableOpacity
                  key={k.id}
                  onPress={() => handleSelectKey(k)}
                  activeOpacity={0.9}
                  className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                      <View className="w-11 h-11 bg-sagard-yellow/10 rounded-2xl items-center justify-center">
                        <KeyIcon size={20} color="#d99e00" />
                      </View>
                      <View>
                        <Text className="text-slate-900 font-black text-sm">{k.name}</Text>
                        <Text className="text-slate-400 text-xs font-bold">Code: {k.code}</Text>
                      </View>
                    </View>
                    <View className={`px-2.5 py-1 rounded-lg ${state.color}`}>
                      <Text className="text-[9px] font-black uppercase">{state.label}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <MapPin size={12} color="#94a3b8" />
                    <Text className="text-slate-500 text-xs font-bold">{k.site?.name ?? '—'}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </View>

      {/* Key detail modal */}
      <Modal visible={!!selectedKey} animationType="slide" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-end">
          <View className="bg-white rounded-t-[40px] h-[85%] overflow-hidden shadow-2xl">
            <View className="flex-row items-center justify-between px-8 py-6 border-b border-slate-50">
              <Text className="font-black text-slate-900 text-xl">Détail clé</Text>
              <TouchableOpacity onPress={() => setSelectedKey(null)} className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center">
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedKey && (
              <ScrollView className="px-8 py-6">
                <View className="flex-row items-center gap-4 mb-6">
                  <View className="w-16 h-16 bg-sagard-yellow/10 rounded-2xl items-center justify-center">
                    <KeyIcon size={28} color="#d99e00" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-black text-lg">{selectedKey.name}</Text>
                    <Text className="text-slate-400 text-xs font-bold">Code: {selectedKey.code}</Text>
                    <Text className="text-slate-400 text-xs">{selectedKey.site?.name ?? '—'}</Text>
                  </View>
                </View>

                {/* Actions */}
                {selectedKey.state === 'DISPONIBLE' && (
                  <TouchableOpacity
                    onPress={() => setShowIssueModal(true)}
                    className="bg-sagard-yellow rounded-2xl py-4 items-center flex-row justify-center gap-2 mb-3"
                  >
                    <ArrowUpFromLine size={20} color="#0f172a" />
                    <Text className="text-sagard-dark font-black text-sm">Remettre la clé</Text>
                  </TouchableOpacity>
                )}
                {selectedKey.state === 'SORTIE' && (
                  <>
                    <TouchableOpacity
                      onPress={handleReturn}
                      className="bg-green-500 rounded-2xl py-4 items-center flex-row justify-center gap-2 mb-3"
                    >
                      <ArrowDownToLine size={20} color="#fff" />
                      <Text className="text-white font-black text-sm">Retour de clé</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleLost}
                      className="bg-red-100 rounded-2xl py-4 items-center flex-row justify-center gap-2 mb-3"
                    >
                      <AlertCircle size={20} color="#ef4444" />
                      <Text className="text-red-700 font-black text-sm">Déclarer perdue</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Movements */}
                <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mt-6 mb-3">Historique des mouvements</Text>
                {movementsLoading ? (
                  <ActivityIndicator color="#f5b800" />
                ) : movements.length === 0 ? (
                  <Text className="text-slate-400 text-center py-4">Aucun mouvement</Text>
                ) : (
                  <View className="space-y-2">
                    {movements.map((m: any) => (
                      <View key={m.id} className="bg-slate-50 rounded-2xl p-4 flex-row items-center gap-3">
                        <View className={`w-8 h-8 rounded-lg items-center justify-center ${m.movementType === 'SORTIE' ? 'bg-amber-100' : m.movementType === 'RETOUR' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {m.movementType === 'SORTIE' ? <ArrowUpFromLine size={14} color="#f59e0b" /> : m.movementType === 'RETOUR' ? <ArrowDownToLine size={14} color="#22c55e" /> : <AlertCircle size={14} color="#ef4444" />}
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-900 font-bold text-xs">{m.movementType}</Text>
                          <Text className="text-slate-400 text-xs">
                            {new Date(m.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Issue key modal */}
      <Modal visible={showIssueModal} animationType="fade" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-center items-center px-6">
          <View className="bg-white rounded-[32px] p-8 w-full shadow-2xl">
            <Text className="font-black text-slate-900 text-xl mb-4">Remettre la clé</Text>
            <Text className="text-slate-400 text-sm mb-4">Indiquez l'ID de la personne à qui la clé est remise (agent ou visiteur)</Text>
            <TextInput
              value={issueTo}
              onChangeText={setIssueTo}
              placeholder="ID personne"
              className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-6 border border-slate-100"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => { setShowIssueModal(false); setIssueTo('') }}
                className="flex-1 bg-slate-100 rounded-2xl py-4 items-center"
              >
                <Text className="text-slate-600 font-bold">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleIssue}
                disabled={submitting}
                className="flex-1 bg-sagard-yellow rounded-2xl py-4 items-center"
              >
                {submitting ? <ActivityIndicator color="#0f172a" /> : <Text className="text-sagard-dark font-black">Confirmer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
