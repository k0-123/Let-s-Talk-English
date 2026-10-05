import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { ApiError, loginRequest, logoutRequest, refreshTokenRequest, request } from '@/lib/api'
import { ADMIN_MESSAGE } from '@/lib/messages'
import { getToken, setToken } from '@/lib/token-store'
import type { Me } from '@/lib/types'

type Status = 'loading' | 'signedOut' | 'signedIn'

type Auth = {
  status: Status
  token: string | null
  me: Me | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  reloadMe: () => Promise<void>
  /** Authenticated request; signs out automatically when the token is rejected. */
  api: <T>(path: string, options?: Parameters<typeof request>[1]) => Promise<T>
}

const AuthContext = createContext<Auth | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>('loading')
  const [token, setTokenState] = useState<string | null>(null)
  const [me, setMe] = useState<Me | null>(null)

  const clear = useCallback(async () => {
    await setToken(null)
    setTokenState(null)
    setMe(null)
    queryClient.clear()
    setStatus('signedOut')
  }, [queryClient])

  const loadMe = useCallback(
    async (t: string) => {
      const data = await request<Me>('/api/app/me', { token: t })
      setMe(data)
      setTokenState(t)
      setStatus('signedIn')
    },
    [],
  )

  // On launch: reuse the stored token, refreshing it so active users stay signed in.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stored = await getToken()
      if (!stored) {
        if (!cancelled) setStatus('signedOut')
        return
      }
      try {
        const refreshed = await refreshTokenRequest(stored).catch(() => null)
        const t = refreshed?.refreshedToken ?? stored
        if (refreshed) await setToken(t)
        if (!cancelled) await loadMe(t)
      } catch {
        if (!cancelled) await clear()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadMe, clear])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { token: t, user } = await loginRequest(email, password)
      if (user.role === 'admin') {
        await logoutRequest(t)
        throw new ApiError(403, ADMIN_MESSAGE)
      }
      await setToken(t)
      try {
        await loadMe(t)
      } catch (error) {
        await setToken(null)
        throw error
      }
    },
    [loadMe],
  )

  const signOut = useCallback(async () => {
    if (token) await logoutRequest(token)
    await clear()
  }, [token, clear])

  const api = useCallback(
    async <T,>(path: string, options: Parameters<typeof request>[1] = {}) => {
      try {
        return await request<T>(path, { ...options, token })
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) await clear()
        throw error
      }
    },
    [token, clear],
  )

  const reloadMe = useCallback(async () => {
    if (token) await loadMe(token)
  }, [token, loadMe])

  const value = useMemo(() => ({ status, token, me, signIn, signOut, reloadMe, api }), [status, token, me, signIn, signOut, reloadMe, api])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): Auth => {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside AuthProvider')
  return auth
}
