import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native'
import * as Location from 'expo-location'
import { LinearGradient } from 'expo-linear-gradient'
import { Clock, MapPin, LogIn, LogOut, CheckCircle, Coffee, PlayCircle } from 'lucide-react-native'
import LottieView from 'lottie-react-native'
import { useAuth } from '../../lib/auth-context'
import { checkIn, checkOut, getTodayPointages, updatePosition, startBreak, endBreak } from '../../services/pointage.service'
import { getMyDeployments } from '../../services/pointage.service'

const GEOFENCE_RADIUS = 100 // mètres

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Rayon Terre en mètres
  const toRad = (deg: number) => deg * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const STATUS_COLORS: Record<string, { bg: string; icon: string; badgeBg: string; badgeText: string }> = {
  TERMINE:  { bg: '#f0fdf4', icon: '#16a34a', badgeBg: '#dcfce7', badgeText: '#15803d' },
  EN_COURS: { bg: '#eff6ff', icon: '#2563eb', badgeBg: '#dbeafe', badgeText: '#1d4ed8' },
  RETARD:   { bg: '#fffbeb', icon: '#d97706', badgeBg: '#fef3c7', badgeText: '#b45309' },
  ABSENT:   { bg: '#fef2f2', icon: '#dc2626', badgeBg: '#fee2e2', badgeText: '#dc2626' },
  DEFAULT:  { bg: '#f8fafc', icon: '#64748b', badgeBg: '#f1f5f9', badgeText: '#475569' },
}

function ShiftButton({ shift, selected, onPress }: { shift: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.shiftBtn, selected ? styles.shiftBtnActive : styles.shiftBtnInactive]}
    >
      <Text style={[styles.shiftBtnText, selected ? styles.shiftBtnTextActive : styles.shiftBtnTextInactive]}>
        {shift === 'JOUR' ? 'Jour' : shift === 'NUIT' ? 'Nuit' : 'Mixte'}
      </Text>
    </TouchableOpacity>
  )
}

function PointageCard({ p }: { p: any }) {
  const c = STATUS_COLORS[p.status] ?? STATUS_COLORS.DEFAULT
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: c.bg }]}>
        <Clock size={24} color={c.icon} strokeWidth={2} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>Vacation {p.shift}</Text>
        <Text style={styles.cardSub}>
          {p.checkInTime ? new Date(p.checkInTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          {p.checkOutTime ? ` → ${new Date(p.checkOutTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ' (en cours)'}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: c.badgeBg }]}>
        <Text style={[styles.badgeText, { color: c.badgeText }]}>{p.status}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  shiftBtn:             { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 2 },
  shiftBtnActive:       { backgroundColor: '#f5b800', borderColor: '#f5b800' },
  shiftBtnInactive:     { backgroundColor: '#ffffff', borderColor: '#f1f5f9' },
  shiftBtnText:         { fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  shiftBtnTextActive:   { color: '#0f172a' },
  shiftBtnTextInactive: { color: '#94a3b8' },
  card:       { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox:    { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardBody:   { flex: 1, marginLeft: 16 },
  cardTitle:  { color: '#0f172a', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: -0.5 },
  cardSub:    { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginTop: 2 },
  badge:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  badgeText:  { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
})

export default function PointageScreen() {
  const { user, agentId } = useAuth()
  const [todayPointages, setTodayPointages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [locationPermission, setLocationPermission] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedShift, setSelectedShift] = useState<'JOUR' | 'NUIT' | 'MIXTE'>('JOUR')
  const [activePointage, setActivePointage] = useState<any | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat?: number; lng?: number } | null>(null)
  const [siteCoords, setSiteCoords] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [distanceToSite, setDistanceToSite] = useState<number | null>(null)
  const [lastPositionUpdate, setLastPositionUpdate] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00')
  const [breakLoading, setBreakLoading] = useState(false)
  const positionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadToday = async () => {
    try {
      const data = await getTodayPointages(agentId ? { agentId } : undefined)
      setTodayPointages(data)
      const active = data.find((p: any) => p.status === 'EN_COURS' || p.status === 'RETARD')
      setActivePointage(active ?? null)
    } catch (e) {
      console.error('loadToday error', e)
    } finally {
      setLoading(false)
    }
  }

  // Live work timer
  useEffect(() => {
    if (activePointage?.checkInTime) {
      const updateTimer = () => {
        const start = new Date(activePointage.checkInTime).getTime()
        const breakMs = (activePointage.breakMinutes || 0) * 60000
        const now = Date.now()
        let elapsed = now - start - breakMs
        if (activePointage.onBreak && activePointage.breakStart) {
          elapsed -= (now - new Date(activePointage.breakStart).getTime())
        }
        if (elapsed < 0) elapsed = 0
        const h = Math.floor(elapsed / 3600000)
        const m = Math.floor((elapsed % 3600000) / 60000)
        const s = Math.floor((elapsed % 60000) / 1000)
        setElapsedTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      }
      updateTimer()
      timerRef.current = setInterval(updateTimer, 1000)
    } else {
      setElapsedTime('00:00:00')
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [activePointage])

  useEffect(() => {
    loadToday()
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setLocationPermission(status === 'granted')
      // Charger les coordonnées du site de déploiement actif
      try {
        if (!agentId) return
        const deps = await getMyDeployments(agentId)
        const active = deps.find((d: any) => d.state === 'ACTIF')
        if (active?.site?.latitude && active?.site?.longitude) {
          setSiteCoords({ lat: active.site.latitude, lng: active.site.longitude, name: active.site.name })
        }
      } catch (e) {
        console.error('Site coords error', e)
      }
    })()
  }, [])

  // Tracking horaire de position pendant le poste
  useEffect(() => {
    const sendPositionUpdate = async () => {
      if (!activePointage) return
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        const lat = loc.coords.latitude
        const lng = loc.coords.longitude
        setCurrentLocation({ lat, lng })
        if (siteCoords) {
          setDistanceToSite(Math.round(haversineDistance(lat, lng, siteCoords.lat, siteCoords.lng)))
        }
        await updatePosition(activePointage.id, { latitude: lat, longitude: lng })
        setLastPositionUpdate(new Date())
      } catch (e) {
        console.error('Position update error', e)
      }
    }

    if (activePointage && locationPermission) {
      // Première mise à jour immédiate, puis toutes les 1 heure
      sendPositionUpdate()
      positionIntervalRef.current = setInterval(sendPositionUpdate, 60 * 60 * 1000)
    }

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current)
        positionIntervalRef.current = null
      }
    }
  }, [activePointage, locationPermission])

  const getLocation = async () => {
    if (!locationPermission) return { latitude: undefined, longitude: undefined }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const lat = loc.coords.latitude
      const lng = loc.coords.longitude
      setCurrentLocation({ lat, lng })
      if (siteCoords) {
        const dist = haversineDistance(lat, lng, siteCoords.lat, siteCoords.lng)
        setDistanceToSite(Math.round(dist))
      }
      return { latitude: lat, longitude: lng }
    } catch {
      return { latitude: undefined, longitude: undefined }
    }
  }

  const handlePointage = async () => {
    setSubmitting(true)
    try {
      const { latitude, longitude } = await getLocation()
      if (!activePointage && siteCoords && latitude && longitude) {
        const dist = haversineDistance(latitude, longitude, siteCoords.lat, siteCoords.lng)
        if (dist > GEOFENCE_RADIUS) {
          Alert.alert(
            'Hors zone',
            `Vous êtes à ${Math.round(dist)}m de votre poste (${siteCoords.name}).\nRapprochez-vous à moins de ${GEOFENCE_RADIUS}m pour pointer.`
          )
          setSubmitting(false)
          return
        }
      }
      if (activePointage) {
        await checkOut(activePointage.id, {
          photoUrl: '',
          latitude,
          longitude,
        })
        Alert.alert('Succès', 'Fin de poste enregistrée')
      } else {
        await checkIn({
          shift: selectedShift,
          photoUrl: '',
          latitude,
          longitude,
          pointingMethod: 'MOBILE',
        })
        Alert.alert('Succès', 'Prise de poste enregistrée')
      }
      setLoading(true)
      await loadToday()
    } catch (e: any) {
      const rawMsg = e.response?.data?.message ?? e?.message ?? 'Erreur lors du pointage'
      const errMsg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg
      Alert.alert('Erreur', errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBreak = async () => {
    if (!activePointage) return
    setBreakLoading(true)
    try {
      if (activePointage.onBreak) {
        await endBreak(activePointage.id)
        Alert.alert('Succès', 'Pause terminée, reprise du poste')
      } else {
        await startBreak(activePointage.id)
        Alert.alert('Succès', 'Pause démarrée')
      }
      await loadToday()
    } catch (e: any) {
      const rawMsg = e.response?.data?.message ?? e?.message ?? 'Erreur lors de la pause'
      const errMsg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg
      Alert.alert('Erreur', errMsg)
    } finally {
      setBreakLoading(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-12 px-6 rounded-b-[40px] shadow-2xl"
      >
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Aujourd'hui</Text>
            <Text className="text-white font-black text-3xl mt-1">
              {user?.firstName}
            </Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5 overflow-hidden">
            <LottieView source={require('../../assets/lottie-calendar.json')} autoPlay loop style={{ width: 48, height: 48 }} />
          </View>
        </View>

        <View className="flex-row items-center gap-2 mt-6 bg-white/5 self-start px-4 py-2 rounded-full border border-white/5">
          <MapPin size={14} color={locationPermission ? '#16a34a' : '#f87171'} />
          <Text className="text-slate-300 text-xs font-semibold">
            {locationPermission ? 'Zone de pointage active' : 'GPS non autorisé'}
          </Text>
        </View>
      </LinearGradient>

      <View className="px-6 -mt-8 mb-10">
        <View className="bg-white rounded-[32px] shadow-xl shadow-slate-200 p-8">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-slate-900 font-black text-xl">Pointage</Text>
            <View className="bg-slate-100 px-3 py-1.5 rounded-lg">
              <Text className="text-slate-500 font-bold text-xs uppercase tracking-tighter">
                {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          </View>

          {activePointage ? (
            <LinearGradient
              colors={['#f0fdf4', '#dcfce7']}
              className="rounded-[24px] p-6 mb-8 border border-green-100"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-green-500 rounded-xl items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle size={20} color="white" />
                </View>
                <View>
                  <Text className="text-green-800 font-bold">En poste actuellement</Text>
                  <Text className="text-green-600 text-xs font-medium uppercase tracking-tighter">
                    Depuis {new Date(activePointage.checkInTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              
              <View className="mt-6 flex-row items-end gap-1">
                <Text className="text-green-900 text-4xl font-black">
                  {activePointage.shift}
                </Text>
                <Text className="text-green-700 font-bold mb-1 text-sm uppercase tracking-widest ml-1">Vacation</Text>
              </View>

              {/* Live work timer */}
              <View style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: '#15803d', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  {activePointage.onBreak ? 'En pause' : 'Temps de travail'}
                </Text>
                <Text style={{ fontSize: 36, fontWeight: '900', color: activePointage.onBreak ? '#d97706' : '#166534', fontVariant: ['tabular-nums'] }}>
                  {elapsedTime}
                </Text>
              </View>

              {/* Pause button */}
              <TouchableOpacity
                onPress={handleBreak}
                disabled={breakLoading}
                activeOpacity={0.8}
                style={{
                  marginTop: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  paddingVertical: 14, borderRadius: 14,
                  backgroundColor: activePointage.onBreak ? '#16a34a' : '#f59e0b',
                }}
              >
                {breakLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    {activePointage.onBreak ? (
                      <PlayCircle size={20} color="white" strokeWidth={2.5} />
                    ) : (
                      <Coffee size={20} color="white" strokeWidth={2.5} />
                    )}
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>
                      {activePointage.onBreak ? 'Reprendre le poste' : 'Prendre une pause'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {lastPositionUpdate && (
                <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} color="#16a34a" />
                  <Text style={{ fontSize: 11, color: '#15803d', fontWeight: '500' }}>
                    Position envoyée à {lastPositionUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — prochaine dans 1h
                  </Text>
                </View>
              )}
            </LinearGradient>
          ) : (
            <View className="bg-slate-50 rounded-[24px] p-8 mb-8 items-center border border-slate-100 border-dashed">
              <Clock size={32} color="#cbd5e1" strokeWidth={1.5} />
              <Text className="text-slate-400 text-center mt-4 font-medium">
                Prêt pour votre prise de poste ?
              </Text>
            </View>
          )}

          {!activePointage && (
            <View className="mb-8">
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 ml-1">Choisir la vacation</Text>
              <View className="flex-row gap-3">
                {(['JOUR', 'NUIT', 'MIXTE'] as const).map((shift) => (
                  <ShiftButton
                    key={shift}
                    shift={shift}
                    selected={selectedShift === shift}
                    onPress={() => setSelectedShift(shift)}
                  />
                ))}
              </View>
            </View>
          )}

          {currentLocation && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 }}>
              <MapPin size={14} color="#2563eb" />
              <Text style={{ color: '#1d4ed8', fontSize: 12, fontWeight: '600' }}>
                Position: {currentLocation.lat?.toFixed(4)}, {currentLocation.lng?.toFixed(4)}
              </Text>
            </View>
          )}

          {!activePointage && siteCoords && distanceToSite !== null && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
              paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16,
              backgroundColor: distanceToSite <= GEOFENCE_RADIUS ? '#f0fdf4' : '#fef2f2',
            }}>
              <MapPin size={14} color={distanceToSite <= GEOFENCE_RADIUS ? '#16a34a' : '#dc2626'} />
              <Text style={{
                fontSize: 12, fontWeight: '600',
                color: distanceToSite <= GEOFENCE_RADIUS ? '#15803d' : '#dc2626',
              }}>
                {distanceToSite <= GEOFENCE_RADIUS
                  ? `Dans la zone (${distanceToSite}m de ${siteCoords.name})`
                  : `${distanceToSite}m de ${siteCoords.name} — rapprochez-vous (${GEOFENCE_RADIUS}m max)`}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handlePointage}
            disabled={submitting}
            activeOpacity={0.9}
            style={{ paddingVertical: 20, borderRadius: 16, alignItems: 'center', backgroundColor: activePointage ? '#ef4444' : '#0f172a' }}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center gap-3">
                {activePointage ? (
                  <LogOut size={20} color="white" strokeWidth={2.5} />
                ) : (
                  <LogIn size={20} color="#f5b800" strokeWidth={2.5} />
                )}
                <Text className="font-black text-lg text-white">
                  {activePointage ? 'Terminer le poste' : 'Prendre mon poste'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Historique */}
        <View className="mt-10">
          <View className="flex-row justify-between items-center mb-5 px-2">
            <Text className="text-slate-900 font-black text-lg">Activité récente</Text>
          </View>

          {loading ? (
            <View className="py-10 items-center">
              <ActivityIndicator color="#f5b800" />
            </View>
          ) : todayPointages.length === 0 ? (
            <View className="bg-white rounded-[24px] p-10 items-center border border-slate-100">
              <Text className="text-slate-400 font-medium italic">Aucun mouvement aujourd'hui</Text>
            </View>
          ) : (
            <View className="space-y-4">
              {todayPointages.map((p: any) => (
                <PointageCard key={p.id} p={p} />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}
