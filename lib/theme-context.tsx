import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useColorScheme } from 'nativewind'
import AsyncStorage from '@react-native-async-storage/async-storage'

type ThemeMode = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  theme: ResolvedTheme
  isDark: boolean
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  theme: 'light',
  isDark: false,
  setMode: () => {},
  toggle: () => {},
})

const STORAGE_KEY = 'sagard-theme-mode'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>('system')

  useEffect(() => {
    ;(async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored)
          applyMode(stored)
        }
      } catch {}
    })()
  }, [])

  const applyMode = (m: ThemeMode) => {
    if (m === 'system') {
      setColorScheme('system')
    } else {
      setColorScheme(m)
    }
  }

  const setMode = (m: ThemeMode) => {
    setModeState(m)
    applyMode(m)
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {})
  }

  const toggle = () => {
    const currentResolved = mode === 'system' ? (colorScheme ?? 'light') : mode
    const next: ThemeMode = currentResolved === 'dark' ? 'light' : 'dark'
    setMode(next)
  }

  const resolvedTheme: ResolvedTheme = mode === 'system' ? (colorScheme ?? 'light') : mode
  const isDark = resolvedTheme === 'dark'

  return (
    <ThemeContext.Provider value={{ mode, theme: resolvedTheme, isDark, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
