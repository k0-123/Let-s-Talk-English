import { ApiError } from './api'

/** Turns server errors into the same wording the website uses. */

export const ADMIN_MESSAGE = 'Admin accounts use the website. Open it in a browser to manage content and users.'

export const loginErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.'
  const text = error.message.toLowerCase()
  if (text.includes('verify')) return 'Please confirm your email address first. Check your inbox for the link we sent you.'
  if (text.includes('locked')) return 'This account is locked after too many failed attempts. Try again in 10 minutes.'
  if (error.status === 401) return 'That email and password do not match.'
  return error.message
}

export const registerErrorMessage = (error: unknown): { field?: 'email'; message: string } => {
  if (!(error instanceof ApiError)) return { message: 'Something went wrong. Please try again.' }
  if (/already registered|must be unique|already exists/i.test(error.message)) {
    return { field: 'email', message: 'An account with this email already exists. Log in or reset your password.' }
  }
  return { message: error.message }
}

export type RegisterInput = { name: string; email: string; password: string; confirmPassword: string }

/** The website's sign-up rules (src/app/(frontend)/auth-actions.ts), checked before sending. */
export const validateRegistration = (input: RegisterInput): Partial<Record<keyof RegisterInput, string>> => {
  const errors: Partial<Record<keyof RegisterInput, string>> = {}
  const name = input.name.trim()
  if (name.length < 2) errors.name = 'Enter your name.'
  else if (name.length > 80) errors.name = 'Name is too long.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = 'Enter a valid email address.'
  if (input.password.length < 8) errors.password = 'Use at least 8 characters.'
  else if (input.password.length > 128) errors.password = 'Use at most 128 characters.'
  if (input.password !== input.confirmPassword) errors.confirmPassword = 'The passwords do not match.'
  return errors
}
