import { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native'
import { CameraView } from 'expo-camera'
import { QrCode, Play, Square, CheckCircle, AlertTriangle, X, MapPin, Clock, Footprints, ChevronRight, Plus } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import { useAuth } from '../../lib/auth-context'
import { getPatrols, startPatrol, scanPatrolPoint, completePatrol, abortPatrol, getPatrol } from '../../services/patrol.service'
import { getMyDeployments } from '../../services/pointage.service'

export default function RondesScreen() {
  const { agentId } = useAuth()
  const [patrols, setPatrols] = useState<any[]>([])
  const [deployments, setDeployments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activePatrol, setActivePatrol] = useState<any | null>(null)
  const [showStartModal, setShowStartModal] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const lastScanRef = useRef<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!agentId) { setLoading(false); return }
    try {
      const [patrolData, depData] = await Promise.all([
        getPatrols({ agentId }),
        getMyDeployments(agentId),
      ])
      setPatrols(patrolData)
      setDeployments(depData.filter((d: any) => d.state === 'ACTIF'))
      const active = patrolData.find((p: any) => p.state === 'EN_COURS')
      if (active) {
        const detail = await getPatrol(active.id)
        setActivePatrol(detail)
      }
    } catch (e) {
      console.error('Rondes error', e)
    } finally {
      setLoading(false)
    }
  }

  const handleStartPatrol = async (siteId: string) => {
    if (!agentId) return
    try {
      const patrol = await startPatrol({ siteId, agentId })
      setShowStartModal(false)
      setActivePatrol(patrol)
      setScanning(true)
      Alert.alert('Ronde démarrée', `Référence: ${patrol.reference}`)
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message ?? 'Impossible de démarrer la ronde')
    }
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!activePatrol || data === lastScanRef.current) return
    lastScanRef.current = data

    try {
      let lat: number | undefined, lng: number | undefined
      const loc = await Location.getCurrentPositionAsync({})
      lat = loc.coords.latitude
      lng = loc.coords.longitude

      await scanPatrolPoint(activePatrol.id, {
        pointCode: data,
        latitude: lat,
        longitude: lng,
      })

      const updated = await getPatrol(activePatrol.id)
      setActivePatrol(updated)
      setScanResult(`Point scanné: ${data}`)

      setTimeout(() => {
        setScanResult(null)
        setScanning(false)
      }, 1500)
    } catch (e: any) {
      Alert.alert('Erreur scan', e?.response?.data?.message ?? 'Point introuvable')
      setScanning(false)
    }
  }

  const handleComplete = async () => {
    if (!activePatrol) return
    Alert.alert(
      'Terminer la ronde',
      `Completion: ${activePatrol.completionPct}%`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: async () => {
            try {
              await completePatrol(activePatrol.id)
              setActivePatrol(null)
              setScanning(false)
              loadData()
              Alert.alert('Succès', 'Ronde terminée')
            } catch (e: any) {
              Alert.alert('Erreur', 'Impossible de terminer la ronde')
            }
          },
        },
      ]
    )
  }

  const handleAbort = async () => {
    if (!activePatrol) return
    Alert.alert('Interrompre', 'Voulez-vous vraiment interrompre cette ronde?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Interrompre',
        style: 'destructive',
        onPress: async () => {
          try {
            await abortPatrol(activePatrol.id)
            setActivePatrol(null)
            setScanning(false)
            loadData()
          } catch {
            Alert.alert('Erreur', 'Impossible d\'interrompre la ronde')
          }
        },
      },
    ])
  }

  const stateColors: Record<string, string> = {
    EN_COURS: 'bg-blue-100 text-blue-700',
    TERMINEE: 'bg-green-100 text-green-700',
    INCOMPLETE: 'bg-orange-100 text-orange-700',
    INTERROMPUE: 'bg-red-100 text-red-700',
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-12 px-6 rounded-b-[40px] shadow-2xl"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Patrouilles</Text>
            <Text className="text-white font-black text-3xl mt-1">Rondes</Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
            <Footprints size={24} color="#f5b800" />
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 -mt-8 mb-10">
        {/* Active patrol card */}
        {activePatrol && (
          <View className="bg-white rounded-[28px] p-6 shadow-xl border border-blue-100 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-blue-100 rounded-2xl items-center justify-center">
                  <Footprints size={24} color="#3b82f6" />
                </View>
                <View>
                  <Text className="text-slate-900 font-black text-base">{activePatrol.reference}</Text>
                  <Text className="text-slate-400 text-xs font-bold uppercase">
                    {activePatrol.site?.name ?? 'Site'}
                  </Text>
                </View>
              </View>
              <View className="px-3 py-1.5 rounded-xl bg-blue-100">
                <Text className="text-[10px] font-black uppercase text-blue-700">En cours</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500 text-xs font-bold">
                  {activePatrol.pointsDone} / {activePatrol.pointsTotal} points
                </Text>
                <Text className="text-slate-700 font-black text-xs">{activePatrol.completionPct}%</Text>
              </View>
              <View className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-sagard-yellow rounded-full"
                  style={{ width: `${Math.min(activePatrol.completionPct, 100)}%` }}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setScanning(true)}
                className="flex-1 bg-sagard-yellow rounded-2xl py-4 items-center flex-row justify-center gap-2"
              >
                <QrCode size={20} color="#0f172a" />
                <Text className="text-sagard-dark font-black text-sm">Scanner</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleComplete}
                className="flex-1 bg-green-500 rounded-2xl py-4 items-center flex-row justify-center gap-2"
              >
                <CheckCircle size={20} color="#fff" />
                <Text className="text-white font-black text-sm">Terminer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAbort}
                className="w-12 h-12 bg-red-100 rounded-2xl items-center justify-center"
              >
                <Square size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Start new patrol button */}
        {!activePatrol && (
          <TouchableOpacity
            onPress={() => setShowStartModal(true)}
            className="bg-sagard-yellow rounded-[28px] p-6 shadow-lg flex-row items-center justify-center gap-3 mb-4"
          >
            <Plus size={24} color="#0f172a" />
            <Text className="text-sagard-dark font-black text-lg">Démarrer une ronde</Text>
          </TouchableOpacity>
        )}

        {/* History */}
        <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] ml-1 mb-3 mt-4">Historique</Text>

        {loading ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200">
            <ActivityIndicator color="#f5b800" />
            <Text className="text-slate-400 font-medium mt-4">Chargement...</Text>
          </View>
        ) : patrols.length === 0 ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200 border border-slate-100">
            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
              <Footprints size={40} color="#cbd5e1" />
            </View>
            <Text className="text-slate-900 font-bold text-lg text-center">Aucune ronde</Text>
            <Text className="text-slate-400 mt-2 text-center leading-5">
              Démarrez votre première ronde en scannant les points de contrôle.
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {patrols.map((p: any) => (
              <View key={p.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-900 font-black text-sm">{p.reference}</Text>
                  <View className={`px-2.5 py-1 rounded-lg ${stateColors[p.state] ?? 'bg-slate-100'}`}>
                    <Text className="text-[9px] font-black uppercase">{p.state}</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2 mb-2">
                  <MapPin size={12} color="#94a3b8" />
                  <Text className="text-slate-500 text-xs font-bold">{p.site?.name ?? '—'}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <Clock size={12} color="#94a3b8" />
                    <Text className="text-slate-400 text-xs">
                      {p.dateStart ? new Date(p.dateStart).toLocaleDateString('fr-FR') : '—'}
                    </Text>
                  </View>
                  <Text className="text-slate-700 font-bold text-xs">
                    {p.pointsDone}/{p.pointsTotal} pts · {p.completionPct}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Start patrol modal */}
      <Modal visible={showStartModal} animationType="slide" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 shadow-2xl">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="font-black text-slate-900 text-2xl">Nouvelle ronde</Text>
              <TouchableOpacity onPress={() => setShowStartModal(false)} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text className="text-slate-400 text-sm font-bold mb-4">Sélectionnez un site</Text>
            {deployments.length === 0 ? (
              <Text className="text-slate-400 text-center py-8">Aucun site assigné actuellement</Text>
            ) : (
              <View className="space-y-3">
                {deployments.map((d: any) => (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => handleStartPatrol(d.siteId)}
                    className="bg-slate-50 rounded-2xl p-4 flex-row items-center justify-between border border-slate-100"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 bg-sagard-yellow/10 rounded-xl items-center justify-center">
                        <MapPin size={18} color="#d99e00" />
                      </View>
                      <View>
                        <Text className="text-slate-900 font-bold text-sm">{d.site?.name ?? 'Site'}</Text>
                        <Text className="text-slate-400 text-xs">{d.site?.city ?? '—'}</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#cbd5e1" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* QR Scanner modal */}
      <Modal visible={scanning} animationType="slide">
        <View className="flex-1 bg-black">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={scanResult ? undefined : handleBarcodeScanned}
          />
          <View className="absolute top-16 left-0 right-0 flex-row justify-between px-6">
            <TouchableOpacity
              onPress={() => { setScanning(false); setScanResult(null) }}
              className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
            <View className="bg-white/20 rounded-full px-4 py-2">
              <Text className="text-white font-bold text-sm">Scannez un point QR</Text>
            </View>
          </View>

          {/* QR frame overlay */}
          <View className="absolute inset-0 items-center justify-center pointer-events-none">
            <View className="w-64 h-64 border-2 border-sagard-yellow rounded-3xl" />
          </View>

          {scanResult && (
            <View className="absolute bottom-32 left-6 right-6 bg-green-500 rounded-2xl p-4 flex-row items-center gap-3">
              <CheckCircle size={24} color="#fff" />
              <Text className="text-white font-bold flex-1">{scanResult}</Text>
            </View>
          )}

          {activePatrol && (
            <View className="absolute bottom-8 left-6 right-6 bg-white/10 backdrop-blur rounded-2xl p-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white font-bold text-sm">{activePatrol.pointsDone}/{activePatrol.pointsTotal} points</Text>
                <Text className="text-sagard-yellow font-black">{activePatrol.completionPct}%</Text>
              </View>
              <View className="h-2 bg-white/20 rounded-full overflow-hidden">
                <View className="h-full bg-sagard-yellow rounded-full" style={{ width: `${Math.min(activePatrol.completionPct, 100)}%` }} />
              </View>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  )
}
