import { Redirect } from 'expo-router'
import { useAuth } from '../lib/auth-context'
import { LoadingScreen } from '../components/UI'

export default function Index() {
  const { user, loading, isController } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Redirect href="/login" />

  if (isController) return <Redirect href="/supervision" />
  return <Redirect href="/pointage" />
}
