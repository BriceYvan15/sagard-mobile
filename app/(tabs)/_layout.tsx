import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Clock, MapPin, User, Footprints, AlertTriangle,
  ShieldCheck, LayoutDashboard, Grid2x2, FileText, Wrench, Building2
} from 'lucide-react-native'
import { useAuth } from '../../lib/auth-context'
import { View, ActivityIndicator } from 'react-native'

export default function TabsLayout() {
  const { isController, isClient, isTechnician, loading } = useAuth()
  const insets = useSafeAreaInsets()

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator color="#f5b800" size="large" />
      </View>
    )
  }

  const tabStyle = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: '#0f172a',
      borderTopColor: '#1e293b',
      paddingBottom: 8 + insets.bottom,
      paddingTop: 8,
      height: 60 + insets.bottom,
    },
    tabBarActiveTintColor: '#f5b800',
    tabBarInactiveTintColor: '#64748b',
  }

  // Controller: 4 tabs
  if (isController) {
    return (
      <Tabs screenOptions={tabStyle}>
        <Tabs.Screen
          name="supervision"
          options={{
            title: 'Supervision',
            tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="controles"
          options={{
            title: 'Contrôles',
            tabBarIcon: ({ color }) => <ShieldCheck size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="incidents"
          options={{
            title: 'Incidents',
            tabBarIcon: ({ color }) => <AlertTriangle size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
        {/* Hidden routes — navigable via router.push */}
        <Tabs.Screen name="pointage" options={{ href: null }} />
        <Tabs.Screen name="affectations" options={{ href: null }} />
        <Tabs.Screen name="paie" options={{ href: null }} />
        <Tabs.Screen name="rondes" options={{ href: null }} />
        <Tabs.Screen name="visiteurs" options={{ href: null }} />
        <Tabs.Screen name="cles" options={{ href: null }} />
        <Tabs.Screen name="rapport" options={{ href: null }} />
        <Tabs.Screen name="operations" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    )
  }

  // Client: 3 tabs (sites/agents, invoices, profile)
  if (isClient) {
    return (
      <Tabs screenOptions={tabStyle}>
        <Tabs.Screen
          name="mes-sites"
          options={{
            title: 'Mes Sites',
            tabBarIcon: ({ color }) => <Building2 size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="factures"
          options={{
            title: 'Factures',
            tabBarIcon: ({ color }) => <FileText size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
        {/* Hidden routes */}
        <Tabs.Screen name="pointage" options={{ href: null }} />
        <Tabs.Screen name="affectations" options={{ href: null }} />
        <Tabs.Screen name="paie" options={{ href: null }} />
        <Tabs.Screen name="rondes" options={{ href: null }} />
        <Tabs.Screen name="visiteurs" options={{ href: null }} />
        <Tabs.Screen name="cles" options={{ href: null }} />
        <Tabs.Screen name="rapport" options={{ href: null }} />
        <Tabs.Screen name="operations" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="supervision" options={{ href: null }} />
        <Tabs.Screen name="controles" options={{ href: null }} />
        <Tabs.Screen name="incidents" options={{ href: null }} />
        <Tabs.Screen name="interventions" options={{ href: null }} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    )
  }

  // Technician: 3 tabs (interventions, notifications, profile)
  if (isTechnician) {
    return (
      <Tabs screenOptions={tabStyle}>
        <Tabs.Screen
          name="interventions"
          options={{
            title: 'Interventions',
            tabBarIcon: ({ color }) => <Wrench size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            tabBarIcon: ({ color }) => <AlertTriangle size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
        {/* Hidden routes */}
        <Tabs.Screen name="pointage" options={{ href: null }} />
        <Tabs.Screen name="affectations" options={{ href: null }} />
        <Tabs.Screen name="paie" options={{ href: null }} />
        <Tabs.Screen name="rondes" options={{ href: null }} />
        <Tabs.Screen name="visiteurs" options={{ href: null }} />
        <Tabs.Screen name="cles" options={{ href: null }} />
        <Tabs.Screen name="rapport" options={{ href: null }} />
        <Tabs.Screen name="operations" options={{ href: null }} />
        <Tabs.Screen name="supervision" options={{ href: null }} />
        <Tabs.Screen name="controles" options={{ href: null }} />
        <Tabs.Screen name="incidents" options={{ href: null }} />
        <Tabs.Screen name="mes-sites" options={{ href: null }} />
        <Tabs.Screen name="factures" options={{ href: null }} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    )
  }

  // Agent: 5 tabs
  return (
    <Tabs screenOptions={tabStyle}>
      <Tabs.Screen
        name="pointage"
        options={{
          title: 'Pointage',
          tabBarIcon: ({ color }) => <Clock size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rondes"
        options={{
          title: 'Rondes',
          tabBarIcon: ({ color }) => <Footprints size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'Opérations',
          tabBarIcon: ({ color }) => <Grid2x2 size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="affectations"
        options={{
          title: 'Affectations',
          tabBarIcon: ({ color }) => <MapPin size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
      {/* Hidden routes — navigable via Opérations hub */}
      <Tabs.Screen name="incidents" options={{ href: null }} />
      <Tabs.Screen name="rapport" options={{ href: null }} />
      <Tabs.Screen name="visiteurs" options={{ href: null }} />
      <Tabs.Screen name="cles" options={{ href: null }} />
      <Tabs.Screen name="paie" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      {/* Hidden controller routes */}
      <Tabs.Screen name="supervision" options={{ href: null }} />
      <Tabs.Screen name="controles" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  )
}
