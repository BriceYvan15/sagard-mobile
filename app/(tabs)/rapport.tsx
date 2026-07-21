import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import {
  FileText, Plus, X, MapPin, Calendar, CloudSun, Users, Car,
  Footprints, Key, ClipboardList, CheckCircle, Send
} from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../lib/auth-context'
import { getDailyReports, createDailyReport, submitReport } from '../../services/report.service'
import { getMyDeployments } from '../../services/pointage.service'
import { getSites } from '../../services/visitor.service'

const WEATHER_OPTIONS = [
  { value: 'DEGAGE', label: 'Dégagé' },
  { value: 'NUAGEUX', label: 'Nuageux' },
  { value: 'PLUVIEUX', label: 'Pluvieux' },
  { value: 'ORAGEUX', label: 'Orageux' },
  { value: 'BROUILLARD', label: 'Brouillard' },
]

const STATE_INFO: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-slate-100 text-slate-600' },
  SOUMIS: { label: 'Soumis', color: 'bg-blue-100 text-blue-700' },
  VALIDE: { label: 'Validé', color: 'bg-green-100 text-green-700' },
  REJETE: { label: 'Rejeté', color: 'bg-red-100 text-red-700' },
}

export default function RapportScreen() {
  const { agentId, user, isController } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [deployments, setDeployments] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formSiteId, setFormSiteId] = useState('')
  const [formShift, setFormShift] = useState('JOUR')
  const [formWeather, setFormWeather] = useState('DEGAGE')
  const [formVisitors, setFormVisitors] = useState('0')
  const [formVehiclesIn, setFormVehiclesIn] = useState('0')
  const [formVehiclesOut, setFormVehiclesOut] = useState('0')
  const [formRounds, setFormRounds] = useState('0')
  const [formKeys, setFormKeys] = useState('0')
  const [formSummary, setFormSummary] = useState('')
  const [formActivities, setFormActivities] = useState('')
  const [formHandover, setFormHandover] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      if (isController) {
        const [sitesData, repData] = await Promise.all([
          getSites(),
          getDailyReports(),
        ])
        setSites(sitesData)
        setReports(repData)
      } else {
        if (!agentId) { setLoading(false); return }
        const [depData, sitesData] = await Promise.all([
          getMyDeployments(agentId),
          getSites(),
        ])
        const activeDeps = depData.filter((d: any) => d.state === 'ACTIF')
        setDeployments(activeDeps)
        setSites(sitesData)
        const siteIds = activeDeps.map((d: any) => d.siteId).filter(Boolean)
        if (siteIds.length > 0) {
          const repData = await getDailyReports({ siteId: siteIds[0] })
          setReports(repData)
        } else {
          setReports([])
        }
      }
    } catch (e) {
      console.error('Reports error', e)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormSiteId('')
    setFormShift('JOUR')
    setFormWeather('DEGAGE')
    setFormVisitors('0')
    setFormVehiclesIn('0')
    setFormVehiclesOut('0')
    setFormRounds('0')
    setFormKeys('0')
    setFormSummary('')
    setFormActivities('')
    setFormHandover('')
  }

  const handleCreate = async () => {
    if (!formSiteId) {
      Alert.alert('Champ requis', 'Sélectionnez un site')
      return
    }
    setSubmitting(true)
    try {
      const report = await createDailyReport({
        siteId: formSiteId,
        shift: formShift,
        weather: formWeather,
        visitorsCount: Number(formVisitors) || 0,
        vehiclesInCount: Number(formVehiclesIn) || 0,
        vehiclesOutCount: Number(formVehiclesOut) || 0,
        roundsDone: Number(formRounds) || 0,
        keysCount: Number(formKeys) || 0,
        summary: formSummary || undefined,
        activities: formActivities || undefined,
        handoverTo: formHandover || undefined,
        submittedBy: agentId ?? user?.id ?? undefined,
      })
      resetForm()
      setShowForm(false)
      loadData()
      Alert.alert('Succès', 'Rapport créé')
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message ?? 'Impossible de créer le rapport')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (id: string) => {
    Alert.alert('Soumettre', 'Confirmer la soumission pour validation?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Soumettre',
        onPress: async () => {
          try {
            await submitReport(id)
            setSelectedReport(null)
            loadData()
            Alert.alert('Succès', 'Rapport soumis')
          } catch (e: any) {
            Alert.alert('Erreur', e?.response?.data?.message ?? 'Impossible de soumettre')
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
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Site</Text>
            <Text className="text-white font-black text-3xl mt-1">Rapports</Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
            <ClipboardList size={24} color="#f5b800" />
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 -mt-8 mb-10">
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="bg-sagard-yellow rounded-[28px] p-6 shadow-lg flex-row items-center justify-center gap-3 mb-4"
        >
          <Plus size={24} color="#0f172a" />
          <Text className="text-sagard-dark font-black text-lg">Nouveau rapport</Text>
        </TouchableOpacity>

        {loading ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200">
            <ActivityIndicator color="#f5b800" />
            <Text className="text-slate-400 font-medium mt-4">Chargement...</Text>
          </View>
        ) : reports.length === 0 ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200 border border-slate-100">
            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
              <FileText size={40} color="#cbd5e1" />
            </View>
            <Text className="text-slate-900 font-bold text-lg text-center">Aucun rapport</Text>
            <Text className="text-slate-400 mt-2 text-center leading-5">
              Créez votre premier rapport quotidien de site.
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {reports.map((r: any) => {
              const state = STATE_INFO[r.state] ?? STATE_INFO.BROUILLON
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setSelectedReport(r)}
                  activeOpacity={0.9}
                  className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                      <View className="w-11 h-11 bg-sagard-yellow/10 rounded-2xl items-center justify-center">
                        <FileText size={20} color="#d99e00" />
                      </View>
                      <View>
                        <Text className="text-slate-900 font-black text-sm">{r.reference}</Text>
                        <Text className="text-slate-400 text-xs font-bold">{r.site?.name ?? '—'}</Text>
                      </View>
                    </View>
                    <View className={`px-2.5 py-1 rounded-lg ${state.color}`}>
                      <Text className="text-[9px] font-black uppercase">{state.label}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Calendar size={12} color="#94a3b8" />
                      <Text className="text-slate-400 text-xs">
                        {new Date(r.date).toLocaleDateString('fr-FR')}
                      </Text>
                      <Text className="text-slate-400 text-xs">· {r.shift}</Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-slate-500 text-xs font-bold">{r.agentCount} agents</Text>
                      <Text className="text-slate-500 text-xs font-bold">{r.visitorsCount} visiteurs</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </View>

      {/* Create form modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-end">
          <View className="bg-white rounded-t-[40px] h-[92%] overflow-hidden shadow-2xl">
            <View className="flex-row items-center justify-between px-8 py-6 border-b border-slate-50">
              <Text className="font-black text-slate-900 text-2xl">Nouveau rapport</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm() }} className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center">
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-8 py-6" showsVerticalScrollIndicator={false}>
              {/* Site */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Site *</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                borderWidth: 2, borderColor: formSiteId ? '#f5b800' : '#f1f5f9',
                backgroundColor: formSiteId ? 'rgba(245,184,0,0.05)' : '#f8fafc',
                borderRadius: 16, marginBottom: 24, paddingHorizontal: 16,
              }}>
                <MapPin size={18} color={formSiteId ? '#d99e00' : '#94a3b8'} />
                <Picker
                  selectedValue={formSiteId}
                  onValueChange={(v: string) => setFormSiteId(v)}
                  style={{ flex: 1, marginLeft: 8, color: '#0f172a' }}
                  dropdownIconColor="#94a3b8"
                >
                  <Picker.Item label="— Sélectionner un site —" value="" />
                  {sites.map((s: any) => (
                    <Picker.Item key={s.id} label={`${s.name} (${s.city ?? '—'})`} value={s.id} />
                  ))}
                </Picker>
              </View>

              {/* Shift */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Vacation</Text>
              <View className="flex-row gap-2 mb-6">
                {['JOUR', 'NUIT', 'FULL'].map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setFormShift(s)}
                    className={`flex-1 py-3 rounded-2xl items-center border-2 ${formShift === s ? 'border-sagard-yellow bg-sagard-yellow/5' : 'border-slate-100'}`}
                  >
                    <Text className={`font-black text-xs ${formShift === s ? 'text-sagard-dark' : 'text-slate-400'}`}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Weather */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Météo</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {WEATHER_OPTIONS.map(w => (
                  <TouchableOpacity
                    key={w.value}
                    onPress={() => setFormWeather(w.value)}
                    className={`px-4 py-2.5 rounded-2xl border-2 ${formWeather === w.value ? 'border-sagard-yellow bg-sagard-yellow/5' : 'border-slate-100'}`}
                  >
                    <Text className={`font-bold text-xs ${formWeather === w.value ? 'text-sagard-dark' : 'text-slate-400'}`}>{w.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Counts grid */}
              <View className="flex-row flex-wrap gap-3 mb-6">
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Visiteurs</Text>
                  <TextInput
                    value={formVisitors}
                    onChangeText={setFormVisitors}
                    keyboardType="numeric"
                    className="bg-slate-50 rounded-2xl px-4 py-3 text-slate-900 font-bold border border-slate-100"
                  />
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Véhicules entrants</Text>
                  <TextInput
                    value={formVehiclesIn}
                    onChangeText={setFormVehiclesIn}
                    keyboardType="numeric"
                    className="bg-slate-50 rounded-2xl px-4 py-3 text-slate-900 font-bold border border-slate-100"
                  />
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Véhicules sortants</Text>
                  <TextInput
                    value={formVehiclesOut}
                    onChangeText={setFormVehiclesOut}
                    keyboardType="numeric"
                    className="bg-slate-50 rounded-2xl px-4 py-3 text-slate-900 font-bold border border-slate-100"
                  />
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Rondes effectuées</Text>
                  <TextInput
                    value={formRounds}
                    onChangeText={setFormRounds}
                    keyboardType="numeric"
                    className="bg-slate-50 rounded-2xl px-4 py-3 text-slate-900 font-bold border border-slate-100"
                  />
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Clés en garde</Text>
                  <TextInput
                    value={formKeys}
                    onChangeText={setFormKeys}
                    keyboardType="numeric"
                    className="bg-slate-50 rounded-2xl px-4 py-3 text-slate-900 font-bold border border-slate-100"
                  />
                </View>
              </View>

              {/* Summary */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Résumé général</Text>
              <TextInput
                value={formSummary}
                onChangeText={setFormSummary}
                placeholder="Résumé de la journée..."
                multiline
                textAlignVertical="top"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-6 border border-slate-100 min-h-[80px]"
              />

              {/* Activities */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Activités notables</Text>
              <TextInput
                value={formActivities}
                onChangeText={setFormActivities}
                placeholder="Activités, événements particuliers..."
                multiline
                textAlignVertical="top"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-6 border border-slate-100 min-h-[80px]"
              />

              {/* Handover */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Relève (transmission)</Text>
              <TextInput
                value={formHandover}
                onChangeText={setFormHandover}
                placeholder="Informations à transmettre au prochain shift..."
                multiline
                textAlignVertical="top"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-8 border border-slate-100 min-h-[80px]"
              />

              <TouchableOpacity
                onPress={handleCreate}
                disabled={submitting}
                className="bg-sagard-yellow rounded-2xl py-5 items-center mb-4"
              >
                {submitting ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text className="text-sagard-dark font-black text-base">Créer le rapport</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail modal */}
      <Modal visible={!!selectedReport} animationType="slide" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-end">
          <View className="bg-white rounded-t-[40px] h-[85%] overflow-hidden shadow-2xl">
            <View className="flex-row items-center justify-between px-8 py-6 border-b border-slate-50">
              <Text className="font-black text-slate-900 text-xl">Détail rapport</Text>
              <TouchableOpacity onPress={() => setSelectedReport(null)} className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center">
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedReport && (
              <ScrollView className="px-8 py-6">
                <Text className="text-slate-900 font-black text-lg mb-1">{selectedReport.reference}</Text>
                <Text className="text-slate-400 text-xs font-bold mb-6">
                  {selectedReport.site?.name} · {new Date(selectedReport.date).toLocaleDateString('fr-FR')} · {selectedReport.shift}
                </Text>

                <View className="space-y-4 mb-6">
                  {selectedReport.weather && (
                    <View className="flex-row items-center gap-3 bg-slate-50 rounded-2xl p-4">
                      <CloudSun size={18} color="#94a3b8" />
                      <Text className="text-slate-700 font-bold capitalize">{selectedReport.weather}</Text>
                    </View>
                  )}
                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-slate-50 rounded-2xl p-4 items-center">
                      <Users size={20} color="#64748b" />
                      <Text className="text-slate-900 font-black text-lg mt-1">{selectedReport.visitorsCount}</Text>
                      <Text className="text-slate-400 text-[10px] font-bold uppercase">Visiteurs</Text>
                    </View>
                    <View className="flex-1 bg-slate-50 rounded-2xl p-4 items-center">
                      <Car size={20} color="#64748b" />
                      <Text className="text-slate-900 font-black text-lg mt-1">{selectedReport.vehiclesInCount}</Text>
                      <Text className="text-slate-400 text-[10px] font-bold uppercase">Véh. in</Text>
                    </View>
                    <View className="flex-1 bg-slate-50 rounded-2xl p-4 items-center">
                      <Footprints size={20} color="#64748b" />
                      <Text className="text-slate-900 font-black text-lg mt-1">{selectedReport.roundsDone}</Text>
                      <Text className="text-slate-400 text-[10px] font-bold uppercase">Rondes</Text>
                    </View>
                  </View>
                  {selectedReport.summary && (
                    <View className="bg-slate-50 rounded-2xl p-4">
                      <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Résumé</Text>
                      <Text className="text-slate-700 leading-5">{selectedReport.summary}</Text>
                    </View>
                  )}
                  {selectedReport.activities && (
                    <View className="bg-slate-50 rounded-2xl p-4">
                      <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Activités</Text>
                      <Text className="text-slate-700 leading-5">{selectedReport.activities}</Text>
                    </View>
                  )}
                  {selectedReport.handoverTo && (
                    <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                      <Text className="text-blue-700 text-xs font-bold uppercase mb-2">Relève</Text>
                      <Text className="text-blue-800 leading-5">{selectedReport.handoverTo}</Text>
                    </View>
                  )}
                </View>

                {selectedReport.state === 'BROUILLON' && (
                  <TouchableOpacity
                    onPress={() => handleSubmit(selectedReport.id)}
                    className="bg-blue-500 rounded-2xl py-4 items-center flex-row justify-center gap-2"
                  >
                    <Send size={20} color="#fff" />
                    <Text className="text-white font-black text-sm">Soumettre pour validation</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
