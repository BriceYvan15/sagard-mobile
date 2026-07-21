import '../global.css'
import { useState, useEffect } from 'react'
import { View, Image } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '../lib/auth-context'
import LottieView from 'lottie-react-native'

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500)
    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <View className="flex-1 items-center justify-center bg-sagard-dark">
      <View style={{ width: 250, height: 250, alignItems: 'center', justifyContent: 'center' }}>
        <LottieView
          source={require('../assets/lottie-splash.json')}
          autoPlay
          loop={false}
          style={{ width: 250, height: 250, position: 'absolute' }}
        />
        <Image
          source={require('../assets/logo-sagard-transparant.png')}
          style={{ width: 160, height: 160, resizeMode: 'contain' }}
        />
      </View>
    </View>
  )
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return (
      <View className="flex-1 bg-sagard-dark">
        <StatusBar style="light" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </View>
    )
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f172a' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  )
}
