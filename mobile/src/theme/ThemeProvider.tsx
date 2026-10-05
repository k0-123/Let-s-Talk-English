import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'

import type { ThemePreference } from '@/lib/types'

import { palettes, type Palette } from './colors'

type Theme = { scheme: 'light' | 'dark'; colors: Palette }

const ThemeContext = createContext<Theme>({ scheme: 'light', colors: palettes.light })

/** Follows the user's saved choice, or the phone's setting when it is "system". */
export const AppThemeProvider = ({ preference, children }: { preference: ThemePreference; children: ReactNode }) => {
  const device = useColorScheme()
  const scheme = preference === 'system' ? (device === 'dark' ? 'dark' : 'light') : preference
  const value = useMemo(() => ({ scheme, colors: palettes[scheme] as Palette }), [scheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useAppTheme = () => useContext(ThemeContext)
