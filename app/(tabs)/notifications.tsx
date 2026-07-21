import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import {
  Bell, CheckCircle, AlertTriangle, Info, ShieldAlert,
  Clock
} from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect } from 'expo-router'
import { useAuth } from '../../lib/auth-context'
import { getNotifications, markNotificationRead, getUnreadCount } from '../../services/notification.service'

const TYPE_ICONS: Record<string, any> = {
  ALERT: ShieldAlert,
  INCIDENT: AlertTriangle,
  INFO: Info,
  SYSTEM: Bell,
  PATROL: Bell,
  PAYROLL: CheckCircle,
}

const TYPE_COLORS: Record<string, string> = {
  ALERT: '#ef4444',
  INCIDENT: '#f59e0b',
  INFO: '#3b82f6',
  SYSTEM: '#64748b',
  PATROL: '#8b5cf6',
  PAYROLL: '#10b981',
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { agentId } = useAuth()

  const loadData = async () => {
    if (!agentId) { setLoading(false); setRefreshing(false); return }
    try {
      const [notifs, count] = await Promise.all([
        getNotifications({ agentId }),
        getUnreadCount({ agentId }),
      ])
      setNotifications(notifs)
      setUnreadCount(typeof count === 'number' ? count : count?.count ?? 0)
    } catch (e) {
      console.error('Notifications error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => {
    loadData()
  }, []))

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (e) {
      console.error('Mark read error', e)
    }
  }

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead)
    for (const n of unread) {
      await handleMarkRead(n.id)
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'À l\'instant'
    if (mins < 60) return `Il y a ${mins} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return d.toLocaleDateString('fr-FR')
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f5b800" />}
    >
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-12 px-6 rounded-b-[40px] shadow-2xl"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Alertes</Text>
            <Text className="text-white font-black text-3xl mt-1">Notifications</Text>
            {unreadCount > 0 && (
              <View className="flex-row items-center gap-2 mt-3">
                <View className="bg-red-500 px-2.5 py-1 rounded-lg">
                  <Text className="text-white text-xs font-black">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</Text>
                </View>
              </View>
            )}
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
            <Bell size={24} color="#f5b800" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center border-2 border-[#1e293b]">
                <Text className="text-white text-[9px] font-black">{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 -mt-8 mb-10">
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            className="bg-sagard-yellow/10 rounded-2xl py-3 px-4 mb-4 flex-row items-center justify-center gap-2 border border-sagard-yellow/20"
          >
            <CheckCircle size={16} color="#d99e00" />
            <Text className="text-sagard-yellow-dark font-bold text-sm">Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200">
            <ActivityIndicator color="#f5b800" />
            <Text className="text-slate-400 font-medium mt-4">Chargement...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200 border border-slate-100">
            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
              <Bell size={40} color="#cbd5e1" />
            </View>
            <Text className="text-slate-900 font-bold text-lg text-center">Aucune notification</Text>
            <Text className="text-slate-400 mt-2 text-center leading-5">
              Vous êtes à jour. Aucune nouvelle alerte.
            </Text>
          </View>
        ) : (
          <View className="space-y-2">
            {notifications.map((n: any) => {
              const Icon = TYPE_ICONS[n.type] ?? Bell
              const color = TYPE_COLORS[n.type] ?? '#64748b'
              return (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => !n.isRead && handleMarkRead(n.id)}
                  activeOpacity={0.8}
                  className={`rounded-[20px] p-4 shadow-sm border ${n.isRead ? 'bg-white border-slate-100' : 'bg-white border-l-4 border-l-sagard-yellow'}`}
                  style={!n.isRead ? { borderLeftWidth: 4, borderLeftColor: '#f5b800' } : null}
                >
                  <View className="flex-row items-start gap-3">
                    <View className="w-10 h-10 rounded-2xl items-center justify-center" style={{ backgroundColor: color + '15' }}>
                      <Icon size={18} color={color} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className={`font-black text-sm ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                          {n.title}
                        </Text>
                        {!n.isRead && <View className="w-2.5 h-2.5 bg-sagard-yellow rounded-full" />}
                      </View>
                      {n.message && (
                        <Text className="text-slate-500 text-xs mt-1 leading-4" numberOfLines={2}>
                          {n.message}
                        </Text>
                      )}
                      <View className="flex-row items-center gap-1.5 mt-2">
                        <Clock size={11} color="#cbd5e1" />
                        <Text className="text-slate-400 text-xs">{formatTime(n.createdAt)}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </View>
    </ScrollView>
  )
}
