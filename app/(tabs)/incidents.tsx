import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Image } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import * as ImagePicker from 'expo-image-picker'
import {
  AlertTriangle, Plus, X, MapPin, Clock, Shield, Phone, FileText,
  Siren, Flame, UserCog, Zap, Droplet, Bug, Camera, Trash2
} from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
import { useAuth } from '../../lib/auth-context'
import { getIncidents, createIncident, uploadIncidentPhoto } from '../../services/incident.service'
import { getMyDeployments } from '../../services/pointage.service'
import { getSites } from '../../services/visitor.service'

const INCIDENT_TYPES = [
  { value: 'INTRUSION', label: 'Intrusion', icon: Shield, color: '#ef4444' },
  { value: 'VOL', label: 'Vol', icon: AlertTriangle, color: '#f59e0b' },
  { value: 'AGGRESSION', label: 'Agression', icon: Siren, color: '#dc2626' },
  { value: 'INCENDIE', label: 'Incendie', icon: Flame, color: '#ea580c' },
  { value: 'VANDALISME', label: 'Vandalisme', icon: Zap, color: '#7c3aed' },
  { value: 'MEDICAL', label: 'Urgence médicale', icon: Droplet, color: '#06b6d4' },
  { value: 'TECHNIQUE', label: 'Problème technique', icon: Bug, color: '#64748b' },
  { value: 'AUTRE', label: 'Autre', icon: FileText, color: '#94a3b8' },
]

const SEVERITY_LEVELS = [
  { value: 'FAIBLE', label: 'Faible', color: '#22c55e', bg: 'bg-green-100' },
  { value: 'MOYEN', label: 'Moyen', color: '#f59e0b', bg: 'bg-amber-100' },
  { value: 'ELEVE', label: 'Élevé', color: '#ef4444', bg: 'bg-red-100' },
  { value: 'CRITIQUE', label: 'Critique', color: '#991b1b', bg: 'bg-red-200' },
]

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  OUVERT: { label: 'Ouvert', color: 'bg-red-100 text-red-700' },
  INVESTIGATION: { label: 'Investigation', color: 'bg-amber-100 text-amber-700' },
  RESOLU: { label: 'Résolu', color: 'bg-green-100 text-green-700' },
  CLOS: { label: 'Clos', color: 'bg-slate-100 text-slate-500' },
}

export default function IncidentsScreen() {
  const { agentId, user, isController } = useAuth()
  const [incidents, setIncidents] = useState<any[]>([])
  const [deployments, setDeployments] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null)

  // Form state
  const [formType, setFormType] = useState('')
  const [formSeverity, setFormSeverity] = useState('FAIBLE')
  const [formSiteId, setFormSiteId] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formActions, setFormActions] = useState('')
  const [formPolice, setFormPolice] = useState(false)
  const [formClient, setFormClient] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [photo, setPhoto] = useState<{ uri: string; name: string; type: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      if (isController) {
        // Contrôleur: charger tous les sites et tous les incidents
        const [sitesData, incData] = await Promise.all([
          getSites(),
          getIncidents(),
        ])
        setSites(sitesData)
        setIncidents(incData)
      } else {
        // Agent: charger ses déploiements et incidents de son site
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
          const incData = await getIncidents({ siteId: siteIds[0] })
          setIncidents(incData)
        } else {
          setIncidents([])
        }
      }
    } catch (e) {
      console.error('Incidents error', e)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormType('')
    setFormSeverity('FAIBLE')
    setFormSiteId('')
    setFormTitle('')
    setFormDesc('')
    setFormActions('')
    setFormPolice(false)
    setFormClient(false)
    setPhoto(null)
  }

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès caméra requis pour prendre des photos')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setPhoto({
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      })
    }
  }

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setPhoto({
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      })
    }
  }

  const handleSubmit = async () => {
    if (!formType || !formSiteId || !formTitle || !formDesc) {
      Alert.alert('Champs requis', 'Type, site, titre et description sont obligatoires')
      return
    }
    setSubmitting(true)
    try {
      const incident = await createIncident({
        title: formTitle,
        siteId: formSiteId,
        incidentType: formType,
        severity: formSeverity,
        description: formDesc,
        actionsTaken: formActions || undefined,
        policeCalled: formPolice,
        clientNotified: formClient,
        reporterId: agentId ?? user?.id ?? undefined,
      })
      // Upload photo si présente
      if (photo && incident?.id) {
        try {
          await uploadIncidentPhoto(incident.id, photo.uri, photo.name, photo.type)
        } catch (uploadErr) {
          console.error('Photo upload error', uploadErr)
        }
      }
      resetForm()
      setShowForm(false)
      loadData()
      Alert.alert('Succès', 'Incident signalé avec succès')
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message ?? 'Impossible de signaler l\'incident')
    } finally {
      setSubmitting(false)
    }
  }

  const getIncidentIcon = (type: string) => {
    const found = INCIDENT_TYPES.find(t => t.value === type)
    return found ?? INCIDENT_TYPES[INCIDENT_TYPES.length - 1]
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Fixed header */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-14 px-6 rounded-b-[36px] shadow-2xl"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Sécurité</Text>
            <Text className="text-white font-black text-3xl mt-1">Incidents</Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5 overflow-hidden">
            <LottieView source={require('../../assets/lottie-alert.json')} autoPlay loop style={{ width: 48, height: 48 }} />
          </View>
        </View>
      </LinearGradient>

      {/* Fixed button */}
      <View className="px-6 -mt-4 mb-3">
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="bg-red-500 rounded-[28px] py-6 shadow-lg flex-row items-center justify-center gap-3"
        >
          <Plus size={22} color="#fff" />
          <Text className="text-white font-black text-base">Signaler un incident</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable list */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200 mb-10">
            <ActivityIndicator color="#f5b800" />
            <Text className="text-slate-400 font-medium mt-4">Chargement...</Text>
          </View>
        ) : incidents.length === 0 ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200 border border-slate-100 mb-10">
            <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-6">
              <Shield size={40} color="#22c55e" />
            </View>
            <Text className="text-slate-900 font-bold text-lg text-center">Aucun incident</Text>
            <Text className="text-slate-400 mt-2 text-center leading-5">
              Aucun incident signalé. Tout semble calme.
            </Text>
          </View>
        ) : (
          <View className="space-y-3 pb-10">
            {incidents.map((inc: any) => {
              const Icon = getIncidentIcon(inc.incidentType).icon
              const iconColor = getIncidentIcon(inc.incidentType).color
              const stateInfo = STATE_LABELS[inc.state] ?? STATE_LABELS.OUVERT
              const sev = SEVERITY_LEVELS.find(s => s.value === inc.severity) ?? SEVERITY_LEVELS[0]
              return (
                <TouchableOpacity
                  key={inc.id}
                  onPress={() => setSelectedIncident(inc)}
                  activeOpacity={0.9}
                  className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-11 h-11 rounded-2xl items-center justify-center" style={{ backgroundColor: iconColor + '15' }}>
                        <Icon size={20} color={iconColor} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 font-black text-sm" numberOfLines={1}>{inc.title}</Text>
                        <Text className="text-slate-400 text-xs font-bold">{inc.reference}</Text>
                      </View>
                    </View>
                    <View className={`px-2.5 py-1 rounded-lg ${stateInfo.color}`}>
                      <Text className="text-[9px] font-black uppercase">{stateInfo.label}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <MapPin size={12} color="#94a3b8" />
                      <Text className="text-slate-500 text-xs font-bold">{inc.site?.name ?? '—'}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className={`px-2 py-0.5 rounded ${sev.bg}`}>
                        <Text className="text-[9px] font-black uppercase" style={{ color: sev.color }}>{sev.label}</Text>
                      </View>
                      <Clock size={12} color="#94a3b8" />
                      <Text className="text-slate-400 text-xs">
                        {new Date(inc.incidentDatetime).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Create incident modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-end">
          <View className="bg-white rounded-t-[40px] h-[92%] overflow-hidden shadow-2xl">
            <View className="flex-row items-center justify-between px-8 py-6 border-b border-slate-50">
              <View>
                <Text className="font-black text-slate-900 text-2xl">Signaler</Text>
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Nouvel incident</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm() }} className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center">
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-8 py-6" showsVerticalScrollIndicator={false}>
              {/* Type selector */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Type d'incident</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {INCIDENT_TYPES.map(t => {
                  const Icon = t.icon
                  const selected = formType === t.value
                  return (
                    <TouchableOpacity
                      key={t.value}
                      onPress={() => setFormType(t.value)}
                      className={`px-4 py-3 rounded-2xl flex-row items-center gap-2 border-2 ${selected ? 'border-sagard-yellow bg-sagard-yellow/5' : 'border-slate-100 bg-slate-50'}`}
                    >
                      <Icon size={16} color={selected ? '#d99e00' : '#94a3b8'} />
                      <Text className={`font-bold text-xs ${selected ? 'text-sagard-dark' : 'text-slate-500'}`}>{t.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {/* Severity */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Sévérité</Text>
              <View className="flex-row gap-2 mb-6">
                {SEVERITY_LEVELS.map(s => (
                  <TouchableOpacity
                    key={s.value}
                    onPress={() => setFormSeverity(s.value)}
                    className={`flex-1 py-3 rounded-2xl items-center border-2 ${formSeverity === s.value ? 'border-current' : 'border-slate-100'}`}
                    style={{ borderColor: formSeverity === s.value ? s.color : '#f1f5f9' }}
                  >
                    <Text className="font-black text-xs" style={{ color: formSeverity === s.value ? s.color : '#94a3b8' }}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Site selector — liste déroulante */}
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

              {/* Title */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Titre</Text>
              <TextInput
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="Ex: Intrusion détectée secteur nord"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-6 border border-slate-100"
              />

              {/* Description */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Description</Text>
              <TextInput
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder="Décrivez l'incident en détail..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-6 border border-slate-100 min-h-[100px]"
              />

              {/* Actions taken */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Actions effectuées (optionnel)</Text>
              <TextInput
                value={formActions}
                onChangeText={setFormActions}
                placeholder="Ex: Périmètre sécurisé, superviseur notifié..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-6 border border-slate-100 min-h-[80px]"
              />

              {/* Photo */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Photo</Text>
              {photo ? (
                <View className="mb-6 relative">
                  <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 200, borderRadius: 16 }} />
                  <TouchableOpacity
                    onPress={() => setPhoto(null)}
                    className="absolute top-2 right-2 w-9 h-9 bg-red-500 rounded-full items-center justify-center"
                  >
                    <Trash2 size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row gap-3 mb-6">
                  <TouchableOpacity
                    onPress={takePhoto}
                    className="flex-1 bg-slate-50 rounded-2xl py-4 items-center border-2 border-slate-100 flex-row justify-center gap-2"
                  >
                    <Camera size={18} color="#64748b" />
                    <Text className="text-slate-600 font-bold text-sm">Prendre photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={pickPhoto}
                    className="flex-1 bg-slate-50 rounded-2xl py-4 items-center border-2 border-slate-100 flex-row justify-center gap-2"
                  >
                    <FileText size={18} color="#64748b" />
                    <Text className="text-slate-600 font-bold text-sm">Galerie</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Toggles */}
              <View className="space-y-3 mb-8">
                <TouchableOpacity
                  onPress={() => setFormPolice(!formPolice)}
                  className={`p-4 rounded-2xl flex-row items-center justify-between border-2 ${formPolice ? 'border-red-300 bg-red-50' : 'border-slate-100'}`}
                >
                  <View className="flex-row items-center gap-3">
                    <Phone size={18} color={formPolice ? '#ef4444' : '#94a3b8'} />
                    <Text className="font-bold text-sm text-slate-900">Police appelée</Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 ${formPolice ? 'bg-red-500 border-red-500' : 'border-slate-300'} items-center justify-center`}>
                    {formPolice && <View className="w-2 h-2 bg-white rounded-full" />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFormClient(!formClient)}
                  className={`p-4 rounded-2xl flex-row items-center justify-between border-2 ${formClient ? 'border-blue-300 bg-blue-50' : 'border-slate-100'}`}
                >
                  <View className="flex-row items-center gap-3">
                    <UserCog size={18} color={formClient ? '#3b82f6' : '#94a3b8'} />
                    <Text className="font-bold text-sm text-slate-900">Client notifié</Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 ${formClient ? 'bg-blue-500 border-blue-500' : 'border-slate-300'} items-center justify-center`}>
                    {formClient && <View className="w-2 h-2 bg-white rounded-full" />}
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className="bg-sagard-yellow rounded-2xl py-5 items-center mb-4"
              >
                {submitting ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text className="text-sagard-dark font-black text-base">Signaler l'incident</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail modal */}
      <Modal visible={!!selectedIncident} animationType="slide" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-end">
          <View className="bg-white rounded-t-[40px] h-[80%] overflow-hidden shadow-2xl">
            <View className="flex-row items-center justify-between px-8 py-6 border-b border-slate-50">
              <Text className="font-black text-slate-900 text-xl">Détail incident</Text>
              <TouchableOpacity onPress={() => setSelectedIncident(null)} className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center">
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedIncident && (
              <ScrollView className="px-8 py-6">
                <Text className="text-slate-900 font-black text-xl mb-2">{selectedIncident.title}</Text>
                <Text className="text-slate-400 text-xs font-bold mb-6">{selectedIncident.reference}</Text>

                <View className="space-y-4">
                  <View className="flex-row items-center gap-3">
                    <MapPin size={16} color="#94a3b8" />
                    <Text className="text-slate-700 font-bold">{selectedIncident.site?.name ?? '—'}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Clock size={16} color="#94a3b8" />
                    <Text className="text-slate-700 font-bold">
                      {new Date(selectedIncident.incidentDatetime).toLocaleString('fr-FR')}
                    </Text>
                  </View>
                  {selectedIncident.description ? (
                <View className="bg-slate-50 rounded-2xl p-4 mt-2">
                  <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Description</Text>
                  <Text className="text-slate-700 leading-5">{selectedIncident.description}</Text>
                </View>
              ) : null}
              {selectedIncident.actionsTaken ? (
                <View className="bg-slate-50 rounded-2xl p-4">
                  <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Actions</Text>
                  <Text className="text-slate-700 leading-5">{selectedIncident.actionsTaken}</Text>
                </View>
              ) : null}
              {selectedIncident.attachmentUrls?.length > 0 && (
                <View className="mb-4">
                  <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Photos</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
                    {selectedIncident.attachmentUrls.map((url: string, i: number) => {
                      const fullUrl = url.startsWith('http') ? url : `${process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'https://sagard.opriel.com'}${url}`
                      return (
                        <Image key={i} source={{ uri: fullUrl }} style={{ width: 150, height: 150, borderRadius: 16 }} />
                      )
                    })}
                  </ScrollView>
                </View>
              )}
              {selectedIncident.resolution ? (
                <View className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <Text className="text-green-700 text-xs font-bold uppercase mb-2">Résolution</Text>
                  <Text className="text-green-800 leading-5">{selectedIncident.resolution}</Text>
                </View>
              ) : null}
              <View className="flex-row gap-3 mt-2">
                {selectedIncident.policeCalled && (
                  <View className="flex-row items-center gap-2 bg-red-50 px-3 py-2 rounded-xl">
                    <Phone size={14} color="#ef4444" />
                    <Text className="text-red-700 font-bold text-xs">Police appelée</Text>
                  </View>
                )}
                {selectedIncident.clientNotified && (
                  <View className="flex-row items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl">
                    <UserCog size={14} color="#3b82f6" />
                    <Text className="text-blue-700 font-bold text-xs">Client notifié</Text>
                  </View>
                )}
              </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}
