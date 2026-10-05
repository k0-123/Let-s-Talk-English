import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useState } from 'react'

import { AuthProvider, useAuth } from '@/auth/AuthProvider'
import { ApiError } from '@/lib/api'
import { AppThemeProvider, useAppTheme } from '@/theme/ThemeProvider'

// Keep the launch screen up until we know whether someone is signed in.
SplashScreen.preventAutoHideAsync().catch(() => undefined)
SplashScreen.setOptions({ fade: true, duration: 250 })

/** Don't retry what the server refused (no access, not found, bad input); do retry network trouble. */
const retry = (failureCount: number, error: unknown) => {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return failureCount < 2
}

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry, staleTime: 30_000 }, mutations: { retry: false } } }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </QueryClientProvider>
  )
}

const ThemedApp = () => {
  const { me } = useAuth()
  return (
    <AppThemeProvider preference={me?.user.theme ?? 'system'}>
      <RootNavigator />
    </AppThemeProvider>
  )
}

/**
 * Which screens exist depends on who is signed in. A screen whose guard is
 * false can't be opened; the app falls back to the index route, which sends
 * each person to their own home.
 */
const RootNavigator = () => {
  const { status, me } = useAuth()
  const { scheme, colors } = useAppTheme()
  const role = me?.user.role

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync().catch(() => undefined)
  }, [status])

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.foreground,
        border: colors.border,
        notification: colors.destructive,
      },
    }
  }, [scheme, colors])

  const withHeader = {
    headerShown: true,
    headerBackTitle: 'Back',
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.background },
    headerTitleStyle: { fontWeight: '700' as const },
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedIn' && role === 'student'}>
          <Stack.Screen name="(student)" />
          <Stack.Screen name="category/[slug]" options={{ ...withHeader, title: 'New sets' }} />
          <Stack.Screen name="join" options={{ ...withHeader, title: 'Join your educator', presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedIn' && role === 'educator'}>
          <Stack.Screen name="(educator)" />
          <Stack.Screen name="student/[id]" options={{ ...withHeader, title: 'Student' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="set/[id]" options={{ ...withHeader, title: 'Question set' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  )
}
