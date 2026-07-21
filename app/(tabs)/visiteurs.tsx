import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import {
  UserPlus, X, MapPin, Clock, Users, CreditCard,
  Building2, Phone, Car, ChevronDown
} from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../lib/auth-context'
import { getVisitors, createVisitor, checkOutVisitor, getSites } from '../../services/visitor.service'
import { getMyDeployments } from '../../services/pointage.service'

const PURPOSES = [
  { value: 'REUNION', label: 'Réunion' },
  { value: 'LIVRAISON', label: 'Livraison' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'FAMILLE', label: 'Famille' },
  { value: 'CANDIDATURE', label: 'Candidature' },
  { value: 'ENTRETIEN', label: 'Entretien' },
  { value: 'AUTRE', label: 'Autre' },
]

const ID_TYPES = [
  { value: 'CNI', label: 'CNI' },
  { value: 'PASSEPORT', label: 'Passeport' },
  { value: 'PERMIS', label: 'Permis' },
  { value: 'BADGE', label: 'Badge' },
  { value: 'AUTRE', label: 'Autre' },
]

export default function VisiteursScreen() {
  const { agentId } = useAuth()
  const [visitors, setVisitors] = useState<any[]>([])
  const [deployments, setDeployments] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // Form
  const [formName, setFormName] = useState('')
  const [formCompany, setFormCompany] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formIdType, setFormIdType] = useState('CNI')
  const [formIdNumber, setFormIdNumber] = useState('')
  const [formPurpose, setFormPurpose] = useState('REUNION')
  const [formHost, setFormHost] = useState('')
  const [formPlate, setFormPlate] = useState('')
  const [formBadge, setFormBadge] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!agentId) { setLoading(false); return }
    try {
      const [depData, sitesData] = await Promise.all([
        getMyDeployments(agentId),
        getSites(),
      ])
      const activeDeps = depData.filter((d: any) => d.state === 'ACTIF')
      setDeployments(activeDeps)
      setSites(sitesData)
      const siteIds = activeDeps.map((d: any) => d.siteId).filter(Boolean)
      if (siteIds.length > 0) {
        const visData = await getVisitors(siteIds[0])
        setVisitors(visData)
      } else {
        setVisitors([])
      }
    } catch (e) {
      console.error('Visitors error', e)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormCompany('')
    setFormPhone('')
    setFormIdType('CNI')
    setFormIdNumber('')
    setFormPurpose('REUNION')
    setFormHost('')
    setFormPlate('')
    setFormBadge('')
  }

  const handleCreate = async () => {
    if (!formName || !selectedSite) {
      Alert.alert('Champs requis', 'Nom du visiteur et site sont obligatoires')
      return
    }
    setSubmitting(true)
    try {
      await createVisitor({
        siteId: selectedSite,
        visitorName: formName,
        visitorCompany: formCompany || undefined,
        visitorPhone: formPhone || undefined,
        idType: formIdType,
        idNumber: formIdNumber || undefined,
        visitPurpose: formPurpose,
        hostName: formHost || undefined,
        plateNumber: formPlate || undefined,
        badgeNo: formBadge || undefined,
        agentId: agentId ?? undefined,
      })
      resetForm()
      setShowForm(false)
      loadData()
      Alert.alert('Succès', 'Visiteur enregistré')
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message ?? 'Impossible d\'enregistrer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckOut = async (id: string) => {
    Alert.alert('Checkout', 'Confirmer la sortie du visiteur?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          try {
            await checkOutVisitor(id)
            loadData()
            Alert.alert('Succès', 'Sortie enregistrée')
          } catch {
            Alert.alert('Erreur', 'Impossible d\'enregistrer la sortie')
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
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Registre</Text>
            <Text className="text-white font-black text-3xl mt-1">Visiteurs</Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
            <Users size={24} color="#f5b800" />
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 -mt-8 mb-10">
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="bg-sagard-yellow rounded-[28px] p-6 shadow-lg flex-row items-center justify-center gap-3 mb-4"
        >
          <UserPlus size={24} color="#0f172a" />
          <Text className="text-sagard-dark font-black text-lg">Nouveau visiteur</Text>
        </TouchableOpacity>

        {loading ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200">
            <ActivityIndicator color="#f5b800" />
            <Text className="text-slate-400 font-medium mt-4">Chargement...</Text>
          </View>
        ) : visitors.length === 0 ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200 border border-slate-100">
            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
              <Users size={40} color="#cbd5e1" />
            </View>
            <Text className="text-slate-900 font-bold text-lg text-center">Aucun visiteur</Text>
            <Text className="text-slate-400 mt-2 text-center leading-5">
              Le registre des visiteurs est vide.
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {visitors.map((v: any) => (
              <View key={v.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-11 h-11 bg-sagard-yellow/10 rounded-2xl items-center justify-center">
                      <Users size={20} color="#d99e00" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 font-black text-sm">{v.visitorName}</Text>
                      {v.visitorCompany ? (
                        <Text className="text-slate-400 text-xs font-bold">{v.visitorCompany}</Text>
                      ) : null}
                    </View>
                  </View>
                  {v.checkOut ? (
                    <View className="px-2.5 py-1 rounded-lg bg-slate-100">
                      <Text className="text-[9px] font-black uppercase text-slate-500">Sorti</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleCheckOut(v.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-100"
                    >
                      <Text className="text-[9px] font-black uppercase text-red-700">Checkout</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <MapPin size={12} color="#94a3b8" />
                    <Text className="text-slate-500 text-xs font-bold">{v.site?.name ?? '—'}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Clock size={12} color="#94a3b8" />
                    <Text className="text-slate-400 text-xs">
                      {new Date(v.checkIn).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
                {v.badgeNo && (
                  <View className="mt-2 flex-row items-center gap-2">
                    <CreditCard size={12} color="#94a3b8" />
                    <Text className="text-slate-500 text-xs font-bold">Badge: {v.badgeNo}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Create visitor modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-end">
          <View className="bg-white rounded-t-[40px] h-[92%] overflow-hidden shadow-2xl">
            <View className="flex-row items-center justify-between px-8 py-6 border-b border-slate-50">
              <Text className="font-black text-slate-900 text-2xl">Nouveau visiteur</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm() }} className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center">
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-8 py-6" showsVerticalScrollIndicator={false}>
              {/* Site selector — liste déroulante */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Site *</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                borderWidth: 2, borderColor: selectedSite ? '#f5b800' : '#f1f5f9',
                backgroundColor: selectedSite ? 'rgba(245,184,0,0.05)' : '#f8fafc',
                borderRadius: 16, marginBottom: 24, paddingHorizontal: 16,
              }}>
                <MapPin size={18} color={selectedSite ? '#d99e00' : '#94a3b8'} />
                <Picker
                  selectedValue={selectedSite}
                  onValueChange={(v: string) => setSelectedSite(v)}
                  style={{ flex: 1, marginLeft: 8, color: '#0f172a' }}
                  dropdownIconColor="#94a3b8"
                >
                  <Picker.Item label="— Sélectionner un site —" value="" />
                  {sites.map((s: any) => (
                    <Picker.Item key={s.id} label={`${s.name} (${s.city ?? '—'})`} value={s.id} />
                  ))}
                </Picker>
              </View>

              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Nom complet *</Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="Nom du visiteur"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-4 border border-slate-100"
              />

              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Société</Text>
              <TextInput
                value={formCompany}
                onChangeText={setFormCompany}
                placeholder="Société / Organisation"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-4 border border-slate-100"
              />

              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Téléphone</Text>
              <TextInput
                value={formPhone}
                onChangeText={setFormPhone}
                placeholder="+225 ..."
                keyboardType="phone-pad"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-4 border border-slate-100"
              />

              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Type de pièce</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {ID_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setFormIdType(t.value)}
                    className={`px-4 py-2.5 rounded-2xl border-2 ${formIdType === t.value ? 'border-sagard-yellow bg-sagard-yellow/5' : 'border-slate-100'}`}
                  >
                    <Text className={`font-bold text-xs ${formIdType === t.value ? 'text-sagard-dark' : 'text-slate-400'}`}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">N° pièce d'identité</Text>
              <TextInput
                value={formIdNumber}
                onChangeText={setFormIdNumber}
                placeholder="Numéro CNI / Passeport"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-4 border border-slate-100"
              />

              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Mot de visite</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {PURPOSES.map(p => (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => setFormPurpose(p.value)}
                    className={`px-4 py-2.5 rounded-2xl border-2 ${formPurpose === p.value ? 'border-sagard-yellow bg-sagard-yellow/5' : 'border-slate-100'}`}
                  >
                    <Text className={`font-bold text-xs ${formPurpose === p.value ? 'text-sagard-dark' : 'text-slate-400'}`}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Hôte visité</Text>
              <TextInput
                value={formHost}
                onChangeText={setFormHost}
                placeholder="Nom de la personne visitée"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-4 border border-slate-100"
              />

              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Plaque véhicule</Text>
              <TextInput
                value={formPlate}
                onChangeText={setFormPlate}
                placeholder="Immatriculation (optionnel)"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-4 border border-slate-100"
              />

              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">N° Badge</Text>
              <TextInput
                value={formBadge}
                onChangeText={setFormBadge}
                placeholder="Numéro de badge remis"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-8 border border-slate-100"
              />

              <TouchableOpacity
                onPress={handleCreate}
                disabled={submitting}
                className="bg-sagard-yellow rounded-2xl py-5 items-center mb-4"
              >
                {submitting ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text className="text-sagard-dark font-black text-base">Enregistrer</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
