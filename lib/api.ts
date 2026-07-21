import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://sagard.opriel.com/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use(async (config) => {
  const token = await getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url ?? ''
      if (!url.includes('/auth/')) {
        await clearAuth()
      }
    }
    return Promise.reject(err)
  },
)

export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem('sagard_token')
  }
  return SecureStore.getItemAsync('sagard_token')
}

export async function getStoredUser(): Promise<any | null> {
  if (Platform.OS === 'web') {
    const raw = localStorage.getItem('sagard_user')
    return raw ? JSON.parse(raw) : null
  }
  const raw = await SecureStore.getItemAsync('sagard_user')
  return raw ? JSON.parse(raw) : null
}

export async function setAuth(token: string, user: any) {
  if (Platform.OS === 'web') {
    localStorage.setItem('sagard_token', token)
    localStorage.setItem('sagard_user', JSON.stringify(user))
  } else {
    await SecureStore.setItemAsync('sagard_token', token)
    await SecureStore.setItemAsync('sagard_user', JSON.stringify(user))
  }
}

export async function clearAuth() {
  if (Platform.OS === 'web') {
    localStorage.removeItem('sagard_token')
    localStorage.removeItem('sagard_user')
  } else {
    await SecureStore.deleteItemAsync('sagard_token')
    await SecureStore.deleteItemAsync('sagard_user')
  }
}
