import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import {
  ShieldCheck, Plus, X, MapPin, Clock, Star, CheckCircle
} from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
import { useAuth } from '../../lib/auth-context'
import { getControls, createControl, updateControl, markControlDone, getSiteAgents } from '../../services/control.service'
import { getSites } from '../../services/visitor.service'

const VISIT_TYPES = [
  { value: 'ROUTINE', label: 'Routine' },
  { value: 'INOPINEE', label: 'Inopinée' },
  { value: 'ALERTE', label: 'Alerte' },
  { value: 'RELEVE', label: 'Relève' },
  { value: 'ESCORTE', label: 'Escorte' },
  { value: 'AUTRE', label: 'Autre' },
]

const STATE_INFO: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-slate-100 text-slate-600' },
  EFFECTUEE: { label: 'Effectuée', color: 'bg-green-100 text-green-700' },
  REPORTEE: { label: 'Reportée', color: 'bg-amber-100 text-amber-700' },
  ANNULEE: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
}

export default function ControlesScreen() {
  const { user, agentId } = useAuth()
  const [controls, setControls] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedControl, setSelectedControl] = useState<any | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Evaluation state
  const [uniformOk, setUniformOk] = useState(false)
  const [equipmentOk, setEquipmentOk] = useState(false)
  const [postureOk, setPostureOk] = useState(false)
  const [registerOk, setRegisterOk] = useState(false)
  const [rating, setRating] = useState(0)
  const [observations, setObservations] = useState('')

  // Form state
  const [formSiteId, setFormSiteId] = useState('')
  const [formVisitType, setFormVisitType] = useState('ROUTINE')
  const [siteAgents, setSiteAgents] = useState<any[]>([])
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
  const [loadingAgents, setLoadingAgents] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ctrlData, sitesData] = await Promise.all([
        getControls({ controllerId: agentId ?? undefined }),
        getSites(),
      ])
      setControls(ctrlData)
      setSites(sitesData)
    } catch (e) {
      console.error('Controls error', e)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormSiteId('')
    setFormVisitType('ROUTINE')
    setSiteAgents([])
    setSelectedAgentIds([])
  }

  const handleSiteChange = async (siteId: string) => {
    setFormSiteId(siteId)
    setSelectedAgentIds([])
    if (siteId) {
      setLoadingAgents(true)
      try {
        const deps = await getSiteAgents(siteId)
        setSiteAgents(deps)
      } catch (e) {
        console.error('Error fetching site agents', e)
        setSiteAgents([])
      } finally {
        setLoadingAgents(false)
      }
    } else {
      setSiteAgents([])
    }
  }

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    )
  }

  const handleCreate = async () => {
    if (!formSiteId) {
      Alert.alert('Champ requis', 'Sélectionnez un site')
      return
    }
    const controllerId = agentId ?? user?.id
    if (!controllerId) {
      Alert.alert('Erreur', 'Utilisateur non identifié')
      return
    }
    setSubmitting(true)
    try {
      await createControl({
        controllerId,
        siteId: formSiteId,
        visitType: formVisitType,
        agentsExpected: selectedAgentIds.length,
      })
      resetForm()
      setShowForm(false)
      loadData()
      Alert.alert('Succès', 'Visite de contrôle créée')
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message ?? 'Impossible de créer la visite')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEvaluate = async () => {
    if (!selectedControl) return
    setSubmitting(true)
    try {
      await updateControl(selectedControl.id, {
        uniformOk,
        equipmentOk,
        postureOk,
        registerOk,
        rating,
        observations,
        agentsChecked: selectedControl.agentsChecked ?? 0,
      })
      await markControlDone(selectedControl.id)
      setSubmitting(false)
      setSelectedControl(null)
      resetEvaluation()
      loadData()
      Alert.alert('Succès', 'Visite évaluée et marquée comme effectuée')
    } catch (e: any) {
      setSubmitting(false)
      Alert.alert('Erreur', e?.response?.data?.message ?? 'Impossible d\'enregistrer')
    }
  }

  const resetEvaluation = () => {
    setUniformOk(false)
    setEquipmentOk(false)
    setPostureOk(false)
    setRegisterOk(false)
    setRating(0)
    setObservations('')
  }

  const handleSelectControl = (c: any) => {
    setSelectedControl(c)
    setUniformOk(c.uniformOk ?? false)
    setEquipmentOk(c.equipmentOk ?? false)
    setPostureOk(c.postureOk ?? false)
    setRegisterOk(c.registerOk ?? false)
    setRating(c.rating ?? 0)
    setObservations(c.observations ?? '')
  }

  const CheckItem = ({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) => (
    <TouchableOpacity
      onPress={onToggle}
      className={`p-4 rounded-2xl flex-row items-center justify-between border-2 ${value ? 'border-green-300 bg-green-50' : 'border-slate-100'}`}
    >
      <Text className={`font-bold text-sm ${value ? 'text-green-700' : 'text-slate-500'}`}>{label}</Text>
      <View className={`w-6 h-6 rounded-full border-2 ${value ? 'bg-green-500 border-green-500' : 'border-slate-300'} items-center justify-center`}>
        {value && <CheckCircle size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  )

  return (
    <View className="flex-1 bg-slate-50">
      {/* Fixed header */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-14 px-6 rounded-b-[36px] shadow-2xl"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Supervision</Text>
            <Text className="text-white font-black text-3xl mt-1">Contrôles</Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5 overflow-hidden">
            <LottieView source={require('../../assets/lottie-shield-check.json')} autoPlay loop style={{ width: 48, height: 48 }} />
          </View>
        </View>
      </LinearGradient>

      {/* Fixed button */}
      <View className="px-6 -mt-4 mb-3">
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="bg-sagard-yellow rounded-[28px] py-6 shadow-lg flex-row items-center justify-center gap-3"
        >
          <Plus size={22} color="#0f172a" />
          <Text className="text-sagard-dark font-black text-base">Nouvelle visite</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable list */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200 mb-10">
            <ActivityIndicator color="#f5b800" />
            <Text className="text-slate-400 font-medium mt-4">Chargement...</Text>
          </View>
        ) : controls.length === 0 ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200 border border-slate-100 mb-10">
            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
              <ShieldCheck size={40} color="#cbd5e1" />
            </View>
            <Text className="text-slate-900 font-bold text-lg text-center">Aucune visite</Text>
            <Text className="text-slate-400 mt-2 text-center leading-5">
              Créez votre première visite de contrôle.
            </Text>
          </View>
        ) : (
          <View className="space-y-3 pb-10">
            {controls.map((c: any) => {
              const state = STATE_INFO[c.state] ?? STATE_INFO.BROUILLON
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => handleSelectControl(c)}
                  activeOpacity={0.9}
                  className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                      <View className="w-11 h-11 bg-sagard-yellow/10 rounded-2xl items-center justify-center">
                        <ShieldCheck size={20} color="#d99e00" />
                      </View>
                      <View>
                        <Text className="text-slate-900 font-black text-sm">{c.reference ?? 'Visite'}</Text>
                        <Text className="text-slate-400 text-xs font-bold capitalize">{c.visitType?.toLowerCase() ?? 'routine'}</Text>
                      </View>
                    </View>
                    <View className={`px-2.5 py-1 rounded-lg ${state.color}`}>
                      <Text className="text-[9px] font-black uppercase">{state.label}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <MapPin size={12} color="#94a3b8" />
                      <Text className="text-slate-500 text-xs font-bold">{c.site?.name ?? '—'}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Clock size={12} color="#94a3b8" />
                      <Text className="text-slate-400 text-xs">
                        {new Date(c.visitDatetime).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                  {c.rating != null && c.rating > 0 && (
                    <View className="flex-row items-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} color={i < c.rating ? '#f5b800' : '#e2e8f0'} fill={i < c.rating ? '#f5b800' : 'transparent'} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Create control modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 shadow-2xl">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="font-black text-slate-900 text-2xl">Nouvelle visite</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm() }} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Type de visite</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {VISIT_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setFormVisitType(t.value)}
                  className={`px-4 py-2.5 rounded-2xl border-2 ${formVisitType === t.value ? 'border-sagard-yellow bg-sagard-yellow/5' : 'border-slate-100'}`}
                >
                  <Text className={`font-bold text-xs ${formVisitType === t.value ? 'text-sagard-dark' : 'text-slate-400'}`}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Site à contrôler</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 2, borderColor: formSiteId ? '#f5b800' : '#f1f5f9',
              backgroundColor: formSiteId ? 'rgba(245,184,0,0.05)' : '#f8fafc',
              borderRadius: 16, marginBottom: 24, paddingHorizontal: 16,
            }}>
              <MapPin size={18} color={formSiteId ? '#d99e00' : '#94a3b8'} />
              <Picker
                selectedValue={formSiteId}
                onValueChange={(v: string) => handleSiteChange(v)}
                style={{ flex: 1, marginLeft: 8, color: '#0f172a' }}
                dropdownIconColor="#94a3b8"
              >
                <Picker.Item label="— Sélectionner un site —" value="" />
                {sites.map((s: any) => (
                  <Picker.Item key={s.id} label={`${s.name} (${s.city ?? '—'})`} value={s.id} />
                ))}
              </Picker>
            </View>

            <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Agents présents ({selectedAgentIds.length})</Text>
            {loadingAgents ? (
              <View className="bg-slate-50 rounded-2xl p-4 items-center mb-8 border border-slate-100">
                <ActivityIndicator color="#f5b800" size="small" />
              </View>
            ) : formSiteId === '' ? (
              <View className="bg-slate-50 rounded-2xl p-4 items-center mb-8 border border-slate-100">
                <Text className="text-slate-400 text-sm font-medium">Sélectionnez d'abord un site</Text>
              </View>
            ) : siteAgents.length === 0 ? (
              <View className="bg-slate-50 rounded-2xl p-4 items-center mb-8 border border-slate-100">
                <Text className="text-slate-400 text-sm font-medium">Aucun agent affecté à ce site</Text>
              </View>
            ) : (
              <View className="mb-8">
                {siteAgents.map((dep: any) => {
                  const agentName = dep.agent?.user ? `${dep.agent.user.firstName} ${dep.agent.user.lastName}` : 'Agent inconnu'
                  const isSelected = selectedAgentIds.includes(dep.agentId)
                  return (
                    <TouchableOpacity
                      key={dep.id}
                      onPress={() => toggleAgent(dep.agentId)}
                      className={`p-4 rounded-2xl flex-row items-center justify-between border-2 mb-2 ${isSelected ? 'border-sagard-yellow bg-sagard-yellow/5' : 'border-slate-100 bg-slate-50'}`}
                    >
                      <View className="flex-row items-center gap-3 flex-1">
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${isSelected ? 'bg-sagard-yellow' : 'bg-slate-200'}`}>
                          {isSelected && <CheckCircle size={16} color="#0f172a" />}
                        </View>
                        <View className="flex-1">
                          <Text className={`font-bold text-sm ${isSelected ? 'text-sagard-dark' : 'text-slate-600'}`}>{agentName}</Text>
                          <Text className="text-slate-400 text-xs">{dep.shift ?? 'JOUR'} · {dep.role ?? 'AGENT'}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            <TouchableOpacity
              onPress={handleCreate}
              disabled={submitting}
              className="bg-sagard-yellow rounded-2xl py-5 items-center mb-4"
            >
              {submitting ? <ActivityIndicator color="#0f172a" /> : <Text className="text-sagard-dark font-black text-base">Créer la visite</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Evaluation modal */}
      <Modal visible={!!selectedControl} animationType="slide" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-end">
          <View className="bg-white rounded-t-[40px] h-[90%] overflow-hidden shadow-2xl">
            <View className="flex-row items-center justify-between px-8 py-6 border-b border-slate-50">
              <Text className="font-black text-slate-900 text-xl">Évaluation</Text>
              <TouchableOpacity onPress={() => setSelectedControl(null)} className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center">
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedControl && (
              <ScrollView className="px-8 py-6">
                <Text className="text-slate-900 font-black text-lg mb-1">{selectedControl.reference ?? 'Visite'}</Text>
                <Text className="text-slate-400 text-xs font-bold mb-6">
                  {selectedControl.site?.name} · {new Date(selectedControl.visitDatetime).toLocaleString('fr-FR')}
                </Text>

                {selectedControl.state === 'BROUILLON' ? (
                  <>
                    <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Contrôles</Text>
                    <View className="space-y-3 mb-6">
                      <CheckItem label="Tenue correcte" value={uniformOk} onToggle={() => setUniformOk(!uniformOk)} />
                      <CheckItem label="Équipement adéquat" value={equipmentOk} onToggle={() => setEquipmentOk(!equipmentOk)} />
                      <CheckItem label="Posture professionnelle" value={postureOk} onToggle={() => setPostureOk(!postureOk)} />
                      <CheckItem label="Registre à jour" value={registerOk} onToggle={() => setRegisterOk(!registerOk)} />
                    </View>

                    <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Note (1-5)</Text>
                    <View className="flex-row gap-2 mb-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <TouchableOpacity key={i} onPress={() => setRating(i + 1)}>
                          <Star size={36} color={i < rating ? '#f5b800' : '#e2e8f0'} fill={i < rating ? '#f5b800' : 'transparent'} />
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Observations</Text>
                    <TextInput
                      value={observations}
                      onChangeText={setObservations}
                      placeholder="Observations sur la visite..."
                      multiline
                      textAlignVertical="top"
                      className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-8 border border-slate-100 min-h-[100px]"
                    />

                    <TouchableOpacity
                      onPress={handleEvaluate}
                      disabled={submitting}
                      className="bg-green-500 rounded-2xl py-5 items-center flex-row justify-center gap-2 mb-4"
                    >
                      {submitting ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <CheckCircle size={20} color="#fff" />
                          <Text className="text-white font-black text-base">Valider la visite</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="space-y-4">
                    <View className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-4">
                      <Text className="text-slate-500 font-bold">Tenue</Text>
                      <Text className={`font-black ${selectedControl.uniformOk ? 'text-green-600' : 'text-red-500'}`}>
                        {selectedControl.uniformOk ? 'OK' : 'KO'}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-4">
                      <Text className="text-slate-500 font-bold">Équipement</Text>
                      <Text className={`font-black ${selectedControl.equipmentOk ? 'text-green-600' : 'text-red-500'}`}>
                        {selectedControl.equipmentOk ? 'OK' : 'KO'}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-4">
                      <Text className="text-slate-500 font-bold">Posture</Text>
                      <Text className={`font-black ${selectedControl.postureOk ? 'text-green-600' : 'text-red-500'}`}>
                        {selectedControl.postureOk ? 'OK' : 'KO'}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-4">
                      <Text className="text-slate-500 font-bold">Registre</Text>
                      <Text className={`font-black ${selectedControl.registerOk ? 'text-green-600' : 'text-red-500'}`}>
                        {selectedControl.registerOk ? 'OK' : 'KO'}
                      </Text>
                    </View>
                    {selectedControl.rating != null && selectedControl.rating > 0 && (
                      <View className="flex-row items-center gap-2 bg-slate-50 rounded-2xl p-4">
                        <Text className="text-slate-500 font-bold flex-1">Note</Text>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={16} color={i < selectedControl.rating ? '#f5b800' : '#e2e8f0'} fill={i < selectedControl.rating ? '#f5b800' : 'transparent'} />
                        ))}
                      </View>
                    )}
                    {selectedControl.observations && (
                      <View className="bg-slate-50 rounded-2xl p-4">
                        <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Observations</Text>
                        <Text className="text-slate-700 leading-5">{selectedControl.observations}</Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}
