import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput, ActivityIndicator } from 'react-native'
import { User, Mail, Phone, Shield, LogOut, ChevronRight, BadgeCheck, Settings, Bell, HelpCircle, Lock, Calendar, X } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth-context'
import { changePassword, getLeaves, requestLeave } from '../../services/hr.service'

const ROLE_LABELS: Record<string, string> = {
  AGENT_TERRAIN: 'Agent Terrain',
  CONTROLEUR: 'Contrôleur',
  CHEF_OPERATIONS: 'Chef Opérations',
  CHEF_POSTE: 'Chef de Poste',
  AGENT_ACCUEIL: 'Agent Accueil',
  DIRECTEUR_GENERAL: 'Directeur Général',
}

export default function ProfilScreen() {
  const { user, logout, agentId } = useAuth()
  const router = useRouter()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaves, setLeaves] = useState<any[]>([])
  const [leavesLoading, setLeavesLoading] = useState(false)

  // Password form
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  // Leave form
  const [leaveType, setLeaveType] = useState('CONGE_ANNUEL')
  const [leaveStart, setLeaveStart] = useState('')
  const [leaveEnd, setLeaveEnd] = useState('')
  const [leaveDays, setLeaveDays] = useState('1')
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveLoading, setLeaveLoading] = useState(false)

  useEffect(() => {
    if (agentId) loadLeaves()
  }, [agentId])

  const loadLeaves = async () => {
    setLeavesLoading(true)
    try {
      const data = await getLeaves({ agentId: agentId ?? undefined })
      setLeaves(data)
    } catch {
      // ignore
    } finally {
      setLeavesLoading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter de votre compte SAGARD ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: async () => { await logout(); router.replace('/login') } },
      ],
      { cancelable: true }
    )
  }

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('Erreur', 'Tous les champs sont requis')
      return
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas')
      return
    }
    if (newPwd.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit faire au moins 6 caractères')
      return
    }
    setPwdLoading(true)
    try {
      await changePassword(currentPwd, newPwd)
      Alert.alert('Succès', 'Mot de passe modifié')
      setShowPasswordModal(false)
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message ?? 'Impossible de changer le mot de passe')
    } finally {
      setPwdLoading(false)
    }
  }

  const handleRequestLeave = async () => {
    if (!agentId || !leaveStart || !leaveEnd) {
      Alert.alert('Erreur', 'Dates de début et fin requises')
      return
    }
    setLeaveLoading(true)
    try {
      await requestLeave({
        agentId,
        type: leaveType,
        startDate: leaveStart,
        endDate: leaveEnd,
        days: Number(leaveDays) || 1,
        reason: leaveReason || undefined,
      })
      Alert.alert('Succès', 'Demande de congé soumise')
      setShowLeaveModal(false)
      setLeaveStart('')
      setLeaveEnd('')
      setLeaveDays('1')
      setLeaveReason('')
      loadLeaves()
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message ?? 'Impossible de soumettre la demande')
    } finally {
      setLeaveLoading(false)
    }
  }

  const InfoItem = ({ icon: Icon, label, value, last = false }: any) => (
    <View className={`flex-row items-center p-5 ${!last ? 'border-b border-slate-50' : ''}`}>
      <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-4">
        <Icon size={20} color="#64748b" strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{label}</Text>
        <Text className="text-slate-900 font-bold text-sm">{value || 'Non renseigné'}</Text>
      </View>
    </View>
  )

  const ActionItem = ({ icon: Icon, label, onPress, variant = 'default' }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center bg-white p-5 rounded-[24px] mb-3 shadow-sm border border-slate-100"
    >
      <View className={`w-10 h-10 ${variant === 'danger' ? 'bg-red-50' : 'bg-sagard-yellow/10'} rounded-xl items-center justify-center mr-4`}>
        <Icon size={20} color={variant === 'danger' ? '#ef4444' : '#d99e00'} strokeWidth={2} />
      </View>
      <Text className={`flex-1 font-black text-sm uppercase tracking-tighter ${variant === 'danger' ? 'text-red-600' : 'text-slate-900'}`}>
        {label}
      </Text>
      <ChevronRight size={18} color="#cbd5e1" />
    </TouchableOpacity>
  )

  const LEAVE_STATES: Record<string, string> = {
    EN_ATTENTE: 'bg-amber-100 text-amber-700',
    APPROUVE: 'bg-green-100 text-green-700',
    REJETE: 'bg-red-100 text-red-700',
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-20 pb-16 px-6 rounded-b-[50px] shadow-2xl items-center"
      >
        <View className="relative">
          <View className="w-32 h-32 bg-sagard-yellow rounded-[45px] items-center justify-center border-4 border-white/10 shadow-2xl">
            {user?.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} className="w-full h-full rounded-[41px]" />
            ) : (
              <Text className="text-sagard-dark font-black text-5xl">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </Text>
            )}
          </View>
          <View className="absolute -bottom-2 -right-2 bg-green-500 w-10 h-10 rounded-2xl border-4 border-[#1e293b] items-center justify-center shadow-lg">
            <BadgeCheck size={18} color="white" />
          </View>
        </View>

        <Text className="text-white font-black text-2xl mt-6">
          {user?.firstName} {user?.lastName}
        </Text>
        <Text className="text-sagard-yellow font-bold text-xs uppercase tracking-[3px] mt-1">
          {ROLE_LABELS[user?.role] ?? user?.role ?? 'Utilisateur'}
        </Text>

        {user?.agent && (
          <View className="bg-white/5 rounded-2xl px-6 py-2 mt-4 border border-white/10">
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center">Matricule</Text>
            <Text className="text-white font-black text-center mt-0.5">{user.agent.matricule}</Text>
          </View>
        )}
      </LinearGradient>

      <View className="px-6 -mt-8 mb-12">
        <View className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-slate-200 border border-slate-100 mb-8">
          <InfoItem icon={Mail} label="Adresse Email" value={user?.email} />
          <InfoItem icon={Phone} label="Téléphone" value={user?.phone} />
          <InfoItem icon={Shield} label="Poste & Rang" value={user?.agent?.position} />
          <InfoItem icon={BadgeCheck} label="Statut du compte" value={user?.status} last />
        </View>

        <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-4 ml-2">Sécurité & Congés</Text>

        <ActionItem icon={Lock} label="Changer le mot de passe" onPress={() => setShowPasswordModal(true)} />
        <ActionItem icon={Calendar} label="Mes congés" onPress={() => setShowLeaveModal(true)} />

        {/* Leaves summary */}
        {leaves.length > 0 && (
          <View className="bg-white rounded-[24px] p-5 mb-3 shadow-sm border border-slate-100">
            <Text className="text-slate-400 text-xs font-bold uppercase mb-3">Dernières demandes</Text>
            {leaves.slice(0, 3).map((l: any) => (
              <View key={l.id} className="flex-row items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <View>
                  <Text className="text-slate-900 font-bold text-xs">{l.type}</Text>
                  <Text className="text-slate-400 text-xs">
                    {new Date(l.startDate).toLocaleDateString('fr-FR')} - {new Date(l.endDate).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View className={`px-2 py-1 rounded-lg ${LEAVE_STATES[l.status] ?? 'bg-slate-100'}`}>
                  <Text className="text-[9px] font-black uppercase">{l.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-4 ml-2 mt-4">Préférences</Text>

        <ActionItem icon={Bell} label="Notifications" onPress={() => {}} />
        <ActionItem icon={Settings} label="Paramètres" onPress={() => {}} />
        <ActionItem icon={HelpCircle} label="Centre d'aide" onPress={() => {}} />
        <ActionItem icon={LogOut} label="Se déconnecter" onPress={handleLogout} variant="danger" />

        <View className="mt-8 items-center">
          <Text className="text-slate-300 text-[10px] font-black uppercase tracking-[4px]">
            SAGARD Mobile v1.0.0
          </Text>
          <Text className="text-slate-300 text-[8px] font-medium mt-1">
            © 2026 SAGARD Sécurité. Tous droits réservés.
          </Text>
        </View>
      </View>

      {/* Change password modal */}
      <Modal visible={showPasswordModal} animationType="fade" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-center items-center px-6">
          <View className="bg-white rounded-[32px] p-8 w-full shadow-2xl">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="font-black text-slate-900 text-xl">Mot de passe</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Mot de passe actuel</Text>
            <TextInput
              value={currentPwd}
              onChangeText={setCurrentPwd}
              secureTextEntry
              placeholder="••••••••"
              className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-4 border border-slate-100"
            />
            <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Nouveau mot de passe</Text>
            <TextInput
              value={newPwd}
              onChangeText={setNewPwd}
              secureTextEntry
              placeholder="••••••••"
              className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-4 border border-slate-100"
            />
            <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Confirmer</Text>
            <TextInput
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              secureTextEntry
              placeholder="••••••••"
              className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-6 border border-slate-100"
            />
            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={pwdLoading}
              className="bg-sagard-yellow rounded-2xl py-4 items-center"
            >
              {pwdLoading ? <ActivityIndicator color="#0f172a" /> : <Text className="text-sagard-dark font-black">Modifier</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Leave request modal */}
      <Modal visible={showLeaveModal} animationType="slide" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-end">
          <View className="bg-white rounded-t-[40px] h-[80%] overflow-hidden shadow-2xl">
            <View className="flex-row items-center justify-between px-8 py-6 border-b border-slate-50">
              <Text className="font-black text-slate-900 text-2xl">Mes congés</Text>
              <TouchableOpacity onPress={() => setShowLeaveModal(false)} className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center">
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-8 py-6">
              {/* Existing leaves */}
              {leavesLoading ? (
                <ActivityIndicator color="#f5b800" />
              ) : leaves.length === 0 ? (
                <Text className="text-slate-400 text-center py-8">Aucune demande de congé</Text>
              ) : (
                <View className="space-y-2 mb-6">
                  {leaves.map((l: any) => (
                    <View key={l.id} className="bg-slate-50 rounded-2xl p-4 flex-row items-center justify-between">
                      <View>
                        <Text className="text-slate-900 font-bold text-sm">{l.type}</Text>
                        <Text className="text-slate-400 text-xs">
                          {new Date(l.startDate).toLocaleDateString('fr-FR')} - {new Date(l.endDate).toLocaleDateString('fr-FR')}
                        </Text>
                        {l.reason && <Text className="text-slate-500 text-xs mt-1">{l.reason}</Text>}
                      </View>
                      <View className={`px-2.5 py-1 rounded-lg ${LEAVE_STATES[l.status] ?? 'bg-slate-100'}`}>
                        <Text className="text-[9px] font-black uppercase">{l.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* New leave form */}
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-3">Nouvelle demande</Text>

              <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Type</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {['CONGE_ANNUEL', 'MALADIE', 'FAMILIAL', 'SANS_SOLDE'].map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setLeaveType(t)}
                    className={`px-4 py-2.5 rounded-2xl border-2 ${leaveType === t ? 'border-sagard-yellow bg-sagard-yellow/5' : 'border-slate-100'}`}
                  >
                    <Text className={`font-bold text-xs ${leaveType === t ? 'text-sagard-dark' : 'text-slate-400'}`}>{t.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Date début (YYYY-MM-DD)</Text>
              <TextInput
                value={leaveStart}
                onChangeText={setLeaveStart}
                placeholder="2026-07-01"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-4 border border-slate-100"
              />

              <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Date fin (YYYY-MM-DD)</Text>
              <TextInput
                value={leaveEnd}
                onChangeText={setLeaveEnd}
                placeholder="2026-07-05"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-4 border border-slate-100"
              />

              <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Nombre de jours</Text>
              <TextInput
                value={leaveDays}
                onChangeText={setLeaveDays}
                keyboardType="numeric"
                placeholder="5"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-4 border border-slate-100"
              />

              <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Motif (optionnel)</Text>
              <TextInput
                value={leaveReason}
                onChangeText={setLeaveReason}
                placeholder="Raison de la demande..."
                multiline
                textAlignVertical="top"
                className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-900 font-medium mb-8 border border-slate-100 min-h-[80px]"
              />

              <TouchableOpacity
                onPress={handleRequestLeave}
                disabled={leaveLoading}
                className="bg-sagard-yellow rounded-2xl py-5 items-center mb-4"
              >
                {leaveLoading ? <ActivityIndicator color="#0f172a" /> : <Text className="text-sagard-dark font-black text-base">Soumettre</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
