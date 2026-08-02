import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeft, Bell, Globe, Moon, Sun, Info, Shield, Download, ChevronRight } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import * as Application from 'expo-application'
import { useTheme } from '../lib/theme-context'

export default function SettingsScreen() {
  const router = useRouter()
  const { isDark, toggle } = useTheme()
  const [smsNotif, setSmsNotif] = useState(false)

  const appVersion = Application.nativeApplicationVersion ?? '1.0.0'
  const buildVersion = Application.nativeBuildVersion ?? '1'

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-12 px-6 rounded-b-[40px] shadow-2xl"
      >
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-1 mb-4">
          <ChevronLeft size={20} color="#94a3b8" />
          <Text className="text-slate-400 text-sm">Retour</Text>
        </TouchableOpacity>
        <Text className="text-white font-black text-2xl">Paramètres</Text>
        <Text className="text-slate-400 text-sm mt-1">Personnalisez votre expérience</Text>
      </LinearGradient>

      <View className="px-4 -mt-6 pb-8">
        {/* Notifications */}
        <View className="mb-6">
          <Text className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-[2px] mb-3 ml-2">Notifications</Text>
          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <View className="flex-row items-center px-5 py-4 border-b border-slate-50 dark:border-slate-800">
              <View className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl items-center justify-center mr-4">
                <Bell size={20} color="#d99e00" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Notifications push</Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Bientôt disponible</Text>
              </View>
              <Switch
                value={false}
                disabled
                trackColor={{ false: '#e2e8f0', true: '#f5b800' }}
                thumbColor="#94a3b8"
              />
            </View>
            <View className="flex-row items-center px-5 py-4 border-b border-slate-50 dark:border-slate-800">
              <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl items-center justify-center mr-4">
                <Shield size={20} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Notifications email</Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Bientôt disponible</Text>
              </View>
              <Switch
                value={false}
                disabled
                trackColor={{ false: '#e2e8f0', true: '#f5b800' }}
                thumbColor="#94a3b8"
              />
            </View>
            <View className="flex-row items-center px-5 py-4">
              <View className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl items-center justify-center mr-4">
                <Bell size={20} color="#16a34a" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Notifications SMS</Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Recevoir les urgences par SMS</Text>
              </View>
              <Switch
                value={smsNotif}
                onValueChange={setSmsNotif}
                trackColor={{ false: '#e2e8f0', true: '#f5b800' }}
                thumbColor={smsNotif ? '#0f172a' : '#94a3b8'}
              />
            </View>
          </View>
        </View>

        {/* Apparence */}
        <View className="mb-6">
          <Text className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-[2px] mb-3 ml-2">Apparence</Text>
          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <TouchableOpacity
              onPress={() => Alert.alert('Langue', 'Le français est la seule langue disponible pour le moment.')}
              className="flex-row items-center px-5 py-4 border-b border-slate-50 dark:border-slate-800"
            >
              <View className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl items-center justify-center mr-4">
                <Globe size={20} color="#9333ea" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Langue</Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Français</Text>
              </View>
              <ChevronRight size={18} color="#cbd5e1" />
            </TouchableOpacity>
            <View className="flex-row items-center px-5 py-4">
              <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${isDark ? 'bg-amber-900/30' : 'bg-slate-100'}`}>
                {isDark ? <Moon size={20} color="#f5b800" /> : <Sun size={20} color="#64748b" />}
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Mode sombre</Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{isDark ? 'Activé' : 'Désactivé'}</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggle}
                trackColor={{ false: '#e2e8f0', true: '#f5b800' }}
                thumbColor={isDark ? '#0f172a' : '#94a3b8'}
              />
            </View>
          </View>
        </View>

        {/* À propos */}
        <View className="mb-6">
          <Text className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-[2px] mb-3 ml-2">À propos</Text>
          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <View className="flex-row items-center px-5 py-4 border-b border-slate-50 dark:border-slate-800">
              <View className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl items-center justify-center mr-4">
                <Info size={20} color="#d99e00" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Version</Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">SAGARD Mobile v{appVersion} (build {buildVersion})</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert('SAGARD Sécurité', 'Application mobile SAGARD Sécurité.\n© 2026 SAGARD Sécurité. Tous droits réservés.')}
              className="flex-row items-center px-5 py-4"
            >
              <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl items-center justify-center mr-4">
                <Shield size={20} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Mentions légales</Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Informations sur l'application</Text>
              </View>
              <ChevronRight size={18} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cache */}
        <View className="mb-6">
          <Text className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-[2px] mb-3 ml-2">Cache</Text>
          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <TouchableOpacity
              onPress={() => Alert.alert('Cache', 'Le cache a été vidé.', [{ text: 'OK' }])}
              className="flex-row items-center px-5 py-4"
            >
              <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl items-center justify-center mr-4">
                <Download size={20} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Vider le cache</Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Libérer de l'espace</Text>
              </View>
              <ChevronRight size={18} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-8 items-center">
          <Text className="text-slate-300 dark:text-slate-600 text-[10px] font-black uppercase tracking-[4px]">
            SAGARD Mobile v{appVersion}
          </Text>
          <Text className="text-slate-300 dark:text-slate-600 text-[8px] font-medium mt-1">
            © 2026 SAGARD Sécurité. Tous droits réservés.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
