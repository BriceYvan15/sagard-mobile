import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getStoredToken, getStoredUser, setAuth, clearAuth } from './api'
import { login as apiLogin, getMe } from '../services/auth.service'

interface AuthContextType {
  user: any | null
  token: string | null
  loading: boolean
  agentId: string | null
  role: string | null
  isAgent: boolean
  isController: boolean
  isClient: boolean
  isTechnician: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  agentId: null,
  role: null,
  isAgent: false,
  isController: false,
  isClient: false,
  isTechnician: false,
  login: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const storedToken = await getStoredToken()
      const storedUser = await getStoredUser()
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(storedUser)
        try {
          const me = await getMe()
          if (me) {
            setUser(me)
            await setAuth(storedToken, me)
          }
        } catch (e) {
          // Token might be expired, clear auth
          await clearAuth()
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    })()
  }, [])

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    if (!data.token) throw new Error('Token manquant dans la réponse de connexion')
    await setAuth(data.token, data.user)
    setToken(data.token)
    setUser(data.user)
    try {
      const me = await getMe()
      if (me) {
        setUser(me)
        await setAuth(data.token, me)
      }
    } catch {
      await setAuth(data.token, data.user)
    }
  }

  const logout = async () => {
    await clearAuth()
    setToken(null)
    setUser(null)
  }

  const agentId = user?.agent?.id ?? null
  const role = user?.role ?? null
  const isAgent = role === 'AGENT_TERRAIN' || role === 'CHEF_POSTE' || role === 'AGENT_ACCUEIL'
  const isController = role === 'CONTROLEUR' || role === 'CHEF_OPERATIONS'
  const isClient = role === 'CLIENT'
  const isTechnician = role === 'TECHNICIEN'

  return (
    <AuthContext.Provider value={{ user, token, loading, agentId, role, isAgent, isController, isClient, isTechnician, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
