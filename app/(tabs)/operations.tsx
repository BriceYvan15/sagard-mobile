import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import {
  AlertTriangle, ClipboardList, Users, Key as KeyIcon, ChevronRight,
  FileText, Bell
} from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

const HUB_ITEMS = [
  {
    label: 'Incidents',
    desc: 'Signaler et suivre les incidents',
    icon: AlertTriangle,
    color: '#ef4444',
    route: '/incidents',
  },
  {
    label: 'Rapport quotidien',
    desc: 'Créer et soumettre un rapport',
    icon: ClipboardList,
    color: '#d99e00',
    route: '/rapport',
  },
  {
    label: 'Visiteurs',
    desc: 'Registre des entrées et sorties',
    icon: Users,
    color: '#3b82f6',
    route: '/visiteurs',
  },
  {
    label: 'Clés',
    desc: 'Gestion du trousseau de clés',
    icon: KeyIcon,
    color: '#8b5cf6',
    route: '/cles',
  },
  {
    label: 'Paie',
    desc: 'Fiches de paie et bulletins',
    icon: FileText,
    color: '#10b981',
    route: '/paie',
  },
  {
    label: 'Notifications',
    desc: 'Alertes et messages reçus',
    icon: Bell,
    color: '#f97316',
    route: '/notifications',
  },
]

export default function OperationsScreen() {
  const router = useRouter()

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-12 px-6 rounded-b-[40px] shadow-2xl"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Gestion</Text>
            <Text className="text-white font-black text-3xl mt-1">Opérations</Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
            <ClipboardList size={24} color="#f5b800" />
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 -mt-8 mb-10">
        <View className="space-y-3">
          {HUB_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.9}
                className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex-row items-center gap-4"
              >
                <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: item.color + '15' }}>
                  <Icon size={22} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-black text-sm">{item.label}</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">{item.desc}</Text>
                </View>
                <ChevronRight size={20} color="#cbd5e1" />
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}
