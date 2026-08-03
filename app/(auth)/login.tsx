import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator, Image, Animated, Easing } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Check } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth-context'
import * as SecureStore from 'expo-secure-store'

export default function LoginScreen() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState<'email' | 'password' | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  // Load saved credentials on mount
  useEffect(() => {
    ;(async () => {
      try {
        const saved = await SecureStore.getItemAsync('sagard_credentials')
        if (saved) {
          const { email: savedEmail, password: savedPassword } = JSON.parse(saved)
          setEmail(savedEmail || '')
          setPassword(savedPassword || '')
          setRememberMe(true)
        }
      } catch {}
    })()
  }, [])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start()
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      if (rememberMe) {
        await SecureStore.setItemAsync('sagard_credentials', JSON.stringify({ email, password }))
      } else {
        await SecureStore.deleteItemAsync('sagard_credentials')
      }
      router.replace('/')
    } catch (e: any) {
      const rawMsg = e.response?.data?.message ?? e?.message ?? 'Identifiants invalides'
      const errMsg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <LinearGradient
        colors={['#0a0f1e', '#0f172a', '#1a2744']}
        className="flex-1"
      >
        {/* Decorative glow circles */}
        <View style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#f5b800', opacity: 0.06 }} />
        <View style={{ position: 'absolute', bottom: 80, left: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: '#f5b800', opacity: 0.04 }} />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 120 }}
          className="px-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Logo section */}
            <View className="items-center mb-10">
              <View className="relative items-center justify-center mb-4">
                {/* Glow behind logo */}
                <View style={{
                  position: 'absolute',
                  width: 130,
                  height: 130,
                  borderRadius: 65,
                  backgroundColor: '#f5b800',
                  opacity: 0.15,
                  transform: [{ scale: 1.3 }],
                }} />
                {/* Logo container */}
                <LinearGradient
                  colors={['#f5b800', '#d99e00']}
                  className="rounded-[28px] items-center justify-center overflow-hidden"
                  style={{ width: 110, height: 110 }}
                >
                  <Image
                    source={require('../../assets/logo-sagard-transparant.png')}
                    style={{ width: 80, height: 80 }}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </View>
              <Text className="text-white font-black text-[32px] tracking-[6px] uppercase">SAGARD</Text>
              <View className="flex-row items-center gap-1.5 mt-2">
                <View className="w-1.5 h-1.5 rounded-full bg-sagard-yellow" />
                <Text className="text-slate-400 text-[11px] tracking-[4px] uppercase font-semibold">
                  Sécurité · Pointage
                </Text>
                <View className="w-1.5 h-1.5 rounded-full bg-sagard-yellow" />
              </View>
            </View>

            {/* Form card — glassmorphism */}
            <View
              className="rounded-[32px] px-7 pt-8 pb-7"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                shadowColor: '#000',
                shadowOpacity: 0.4,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 10 },
                elevation: 12,
              }}
            >
              {/* Header with Lottie camera animation */}
              <View className="flex-row items-center gap-3 mb-7">
                <View className="w-12 h-12 rounded-2xl items-center justify-center overflow-hidden" style={{ backgroundColor: 'rgba(245,184,0,0.08)' }}>
                  <LottieView
                    source={require('../../assets/lottie-camera-scan.json')}
                    autoPlay
                    loop
                    style={{ width: 48, height: 48 }}
                  />
                </View>
                <View>
                  <Text className="text-white font-black text-xl">Bienvenue</Text>
                  <Text className="text-slate-400 text-[13px]">Connectez-vous pour continuer</Text>
                </View>
              </View>

              {/* Email field */}
              <View className="mb-5">
                <Text className="text-slate-300 text-[11px] font-bold mb-2.5 uppercase tracking-widest ml-1">
                  Adresse email
                </Text>
                <View
                  className="flex-row items-center rounded-2xl px-4"
                  style={{
                    height: 54,
                    backgroundColor: isFocused === 'email' ? 'rgba(245,184,0,0.06)' : 'rgba(15,23,42,0.5)',
                    borderWidth: 1.5,
                    borderColor: isFocused === 'email' ? '#f5b800' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Mail size={20} color={isFocused === 'email' ? '#f5b800' : '#64748b'} strokeWidth={2} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="votre@email.com"
                    placeholderTextColor="#475569"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setIsFocused('email')}
                    onBlur={() => setIsFocused(null)}
                    className="flex-1 text-white px-3 text-[15px] font-medium"
                  />
                </View>
              </View>

              {/* Password field */}
              <View className="mb-6">
                <Text className="text-slate-300 text-[11px] font-bold mb-2.5 uppercase tracking-widest ml-1">
                  Mot de passe
                </Text>
                <View
                  className="flex-row items-center rounded-2xl px-4"
                  style={{
                    height: 54,
                    backgroundColor: isFocused === 'password' ? 'rgba(245,184,0,0.06)' : 'rgba(15,23,42,0.5)',
                    borderWidth: 1.5,
                    borderColor: isFocused === 'password' ? '#f5b800' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Lock size={20} color={isFocused === 'password' ? '#f5b800' : '#64748b'} strokeWidth={2} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                    secureTextEntry={!showPassword}
                    onFocus={() => setIsFocused('password')}
                    onBlur={() => setIsFocused(null)}
                    className="flex-1 text-white px-3 text-[15px] font-medium"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#94a3b8" />
                    ) : (
                      <Eye size={20} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember me */}
              <TouchableOpacity
                onPress={() => setRememberMe(!rememberMe)}
                className="flex-row items-center gap-2.5 mb-5"
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: rememberMe ? '#f5b800' : 'rgba(255,255,255,0.2)',
                    backgroundColor: rememberMe ? '#f5b800' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {rememberMe && <Check size={14} color="#0f172a" strokeWidth={3} />}
                </View>
                <Text className="text-slate-300 text-[13px] font-medium">Se souvenir de moi</Text>
              </TouchableOpacity>

              {/* Error */}
              {error && (
                <View className="flex-row items-center gap-2.5 rounded-2xl px-4 py-3.5 mb-5" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' }}>
                  <AlertCircle size={16} color="#f87171" />
                  <Text className="text-red-400 text-[13px] flex-1 font-medium">{error}</Text>
                </View>
              )}

              {/* Submit button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
                style={{
                  height: 54,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: loading ? 'rgba(217,158,0,0.5)' : '#f5b800',
                  shadowColor: '#f5b800',
                  shadowOpacity: loading ? 0 : 0.35,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: loading ? 0 : 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <>
                    <Text className="text-sagard-dark font-black text-[15px] tracking-wide">
                      Se connecter
                    </Text>
                    <ArrowRight size={20} color="#0f172a" strokeWidth={2.5} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="items-center mt-8">
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-px bg-white/10" />
                <Text className="text-slate-500 text-[10px] tracking-widest uppercase font-semibold">
                  SAGARD Mobile v1.0.0
                </Text>
                <View className="w-6 h-px bg-white/10" />
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}
