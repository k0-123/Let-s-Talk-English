import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { isApprovedEducator } from '@/access'
import type { User } from '@/payload-types'

import { getPayloadClient } from './payload'

/** The logged-in user for this request, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  // Read the request headers first: this marks the page as dynamic before
  // anything touches the database, so `next build` never connects to it.
  const requestHeaders = await headers()
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: requestHeaders })
  return (user as User | null) ?? null
})

export const homePathFor = (user: Pick<User, 'role' | 'approved'>): string => {
  if (user.role === 'admin') return '/admin'
  if (user.role === 'educator') return isApprovedEducator(user) ? '/educator' : '/awaiting-approval'
  return '/dashboard'
}

/**
 * Use at the top of every protected page and server action. Redirects to the
 * login page when logged out, and to the user's own home when the role is wrong.
 */
export const requireUser = async (roles?: User['role'][]): Promise<User> => {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (roles && !roles.includes(user.role)) redirect(homePathFor(user))
  if (user.role === 'educator' && !isApprovedEducator(user)) redirect('/awaiting-approval')
  return user
}

/** Only allow redirects to paths on this site (no open redirects). */
export const safeNextPath = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}

export const clientIp = async (): Promise<string> => {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}
