'use server'

import config from '@payload-config'
import { login, logout } from '@payloadcms/next/auth'
import { redirect } from 'next/navigation'
import { APIError, AuthenticationError, LockedAuth, UnverifiedEmail, ValidationError } from 'payload'
import { z } from 'zod'

import { verifyEmailHTML, verifyEmailSubject } from '@/email/templates'
import { clientIp, homePathFor, safeNextPath } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import type { User } from '@/payload-types'

export type FormState = {
  error?: string
  success?: string
  fieldErrors?: Record<string, string>
  values?: Record<string, string>
  /** Login only: offer to resend the confirmation email. */
  unverifiedEmail?: string
}

const FIFTEEN_MINUTES = 15 * 60 * 1000
const ONE_HOUR = 60 * 60 * 1000

const tooMany = (retryAfterSeconds: number): FormState => ({
  error: `Too many attempts. Please try again in ${Math.max(1, Math.ceil(retryAfterSeconds / 60))} minute(s).`,
})

const field = (formData: FormData, name: string): string => String(formData.get(name) ?? '').trim()

// ---------------------------------------------------------------------------
// Log in / log out
// ---------------------------------------------------------------------------

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, 'email').toLowerCase()
  const password = String(formData.get('password') ?? '')
  const values = { email }

  if (!email || !password) return { error: 'Enter your email and password.', values }

  const limit = rateLimit(`login:${await clientIp()}`, 20, FIFTEEN_MINUTES)
  if (!limit.ok) return { ...tooMany(limit.retryAfterSeconds), values }

  let user: User
  try {
    const result = await login({ collection: 'users', config, email, password })
    user = result.user as User
  } catch (error) {
    if (error instanceof UnverifiedEmail) {
      return {
        error: 'Please confirm your email address first. Check your inbox for the link we sent you.',
        unverifiedEmail: email,
        values,
      }
    }
    if (error instanceof LockedAuth) {
      return { error: 'This account is locked after too many failed attempts. Try again in 10 minutes.', values }
    }
    if (error instanceof AuthenticationError) {
      return { error: 'That email and password do not match.', values }
    }
    if (error instanceof APIError && error.isPublic) return { error: error.message, values }
    throw error
  }

  redirect(safeNextPath(formData.get('next')) ?? homePathFor(user))
}

export async function logoutAction(): Promise<void> {
  await logout({ config })
  redirect('/login')
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name.').max(80, 'Name is too long.'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
    password: z.string().min(8, 'Use at least 8 characters.').max(128),
    confirmPassword: z.string(),
    role: z.enum(['student', 'educator'], { message: 'Choose student or educator.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'The passwords do not match.',
    path: ['confirmPassword'],
  })

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    name: field(formData, 'name'),
    email: field(formData, 'email'),
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
    role: field(formData, 'role') || 'student',
  }
  const values = { name: raw.name, email: raw.email, role: raw.role }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      fieldErrors[key] ??= issue.message
    }
    return { fieldErrors, values }
  }

  const limit = rateLimit(`register:${await clientIp()}`, 10, ONE_HOUR)
  if (!limit.ok) return { ...tooMany(limit.retryAfterSeconds), values }

  const payload = await getPayloadClient()
  const { name, email, password, role } = parsed.data
  try {
    // Runs as an anonymous visitor, so the collection's access rules apply
    // (no admin accounts, no self-approval). Payload sends the confirmation email.
    await payload.create({
      collection: 'users',
      data: { name, email, password, role } as User,
      overrideAccess: false,
    })
  } catch (error) {
    if (error instanceof ValidationError && error.data.errors.some((e) => e.path === 'email')) {
      return {
        fieldErrors: { email: 'An account with this email already exists. Log in or reset your password.' },
        values,
      }
    }
    throw error
  }

  redirect(`/register/check-email?role=${role}`)
}

// ---------------------------------------------------------------------------
// Email confirmation
// ---------------------------------------------------------------------------

const RESEND_MESSAGE =
  'If there is an unconfirmed account for that email, we have sent a new confirmation link. Check your spam folder too.'

export async function resendVerificationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, 'email').toLowerCase()
  if (!email) return { error: 'Enter your email address.' }

  const limit = rateLimit(`resend:${await clientIp()}`, 5, ONE_HOUR)
  if (!limit.ok) return tooMany(limit.retryAfterSeconds)

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    showHiddenFields: true,
    overrideAccess: true,
  })
  const user = docs[0] as (User & { _verificationToken?: string | null }) | undefined
  if (user && !user._verified && user._verificationToken) {
    await payload.sendEmail({
      to: user.email,
      subject: verifyEmailSubject(),
      html: verifyEmailHTML({ name: user.name, token: user._verificationToken }),
    })
  }
  // Same answer either way, so this cannot be used to find out who has an account.
  return { success: RESEND_MESSAGE }
}

// ---------------------------------------------------------------------------
// Forgotten password
// ---------------------------------------------------------------------------

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, 'email').toLowerCase()
  if (!z.string().email().safeParse(email).success) {
    return { fieldErrors: { email: 'Enter a valid email address.' }, values: { email } }
  }

  const limit = rateLimit(`forgot:${await clientIp()}`, 5, ONE_HOUR)
  if (!limit.ok) return tooMany(limit.retryAfterSeconds)

  const payload = await getPayloadClient()
  await payload.forgotPassword({ collection: 'users', data: { email } }).catch(() => undefined)
  return {
    success: 'If an account exists for that email, we have sent a link to reset your password. It expires in one hour.',
  }
}

const resetSchema = z
  .object({
    token: z.string().min(1, 'This reset link is incomplete. Request a new one.'),
    password: z.string().min(8, 'Use at least 8 characters.').max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'The passwords do not match.',
    path: ['confirmPassword'],
  })

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse({
    token: field(formData, 'token'),
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message
    return fieldErrors.token ? { error: fieldErrors.token } : { fieldErrors }
  }

  const payload = await getPayloadClient()
  try {
    await payload.resetPassword({
      collection: 'users',
      data: { token: parsed.data.token, password: parsed.data.password },
      overrideAccess: true,
    })
  } catch {
    return { error: 'This reset link is invalid or has expired. Please request a new one.' }
  }
  redirect('/login?reset=1')
}
