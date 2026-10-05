'use server'

import config from '@payload-config'
import { logout } from '@payloadcms/next/auth'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import { THEME_COOKIE, parseTheme, type ThemePreference } from '@/lib/theme'

export type AccountState = { error?: string; success?: string; fieldErrors?: Record<string, string> }

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80, 'Name is too long.'),
  weeklyGoal: z.coerce.number().int().min(1, 'At least 1 set a week.').max(50, 'At most 50 sets a week.').optional(),
})

export async function updateProfileAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser()
  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    weeklyGoal: user.role === 'student' ? formData.get('weeklyGoal') : undefined,
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message
    return { fieldErrors }
  }
  const payload = await getPayloadClient()
  await payload.update({ collection: 'users', id: user.id, data: parsed.data, overrideAccess: false, user })
  revalidatePath('/', 'layout')
  return { success: 'Saved.' }
}

export async function saveThemeAction(theme: ThemePreference): Promise<void> {
  const user = await requireUser()
  const value = parseTheme(theme)
  ;(await cookies()).set(THEME_COOKIE, value, { path: '/', maxAge: 31536000, sameSite: 'lax' })
  const payload = await getPayloadClient()
  await payload.update({ collection: 'users', id: user.id, data: { theme: value }, overrideAccess: false, user })
}

export async function dismissOnboardingAction(): Promise<void> {
  const user = await requireUser()
  const payload = await getPayloadClient()
  await payload.update({ collection: 'users', id: user.id, data: { onboardingDismissed: true }, overrideAccess: false, user })
  revalidatePath('/', 'layout')
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    password: z.string().min(8, 'Use at least 8 characters.').max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'The passwords do not match.', path: ['confirmPassword'] })

export async function changePasswordAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser()
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message
    return { fieldErrors }
  }
  if (!rateLimit(`password:${user.id}`, 5, 15 * 60 * 1000).ok) {
    return { error: 'Too many attempts. Please wait a few minutes.' }
  }

  const payload = await getPayloadClient()
  try {
    // Checking the current password through login also counts failed attempts towards the lockout.
    await payload.login({ collection: 'users', data: { email: user.email, password: parsed.data.currentPassword } })
  } catch {
    return { fieldErrors: { currentPassword: 'That is not your current password.' } }
  }
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { password: parsed.data.password },
    overrideAccess: false,
    user,
  })
  return { success: 'Your password has been changed.' }
}

export async function logoutEverywhereAction(): Promise<void> {
  await requireUser()
  await logout({ config, allSessions: true })
  redirect('/login')
}
