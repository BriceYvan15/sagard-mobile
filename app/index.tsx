import { Redirect } from 'expo-router'
import { useAuth } from '../lib/auth-context'
import { LoadingScreen } from '../components/UI'

export default function Index() {
  const { user, loading, isController, isClient, isTechnician } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Redirect href="/login" />

  if (isController) return <Redirect href="/supervision" />
  if (isClient) return <Redirect href="/mes-sites" />
  if (isTechnician) return <Redirect href="/interventions" />
  return <Redirect href="/pointage" />
}
