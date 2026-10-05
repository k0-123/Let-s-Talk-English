import { expect, type Page } from '@playwright/test'
import type { Payload } from 'payload'

import { E2E_DATABASE_URL } from '../../playwright.config'

export const PASSWORD = 'Password123!'

export const accounts = {
  admin: { email: 'admin@e2e.test', name: 'Ada Admin' },
  educator: { email: 'educator@e2e.test', name: 'Eve Educator' },
  otherEducator: { email: 'other-educator@e2e.test', name: 'Oscar Other' },
  student: { email: 'student@e2e.test', name: 'Stan Student' },
  otherStudent: { email: 'other-student@e2e.test', name: 'Olive Other' },
} as const

let payloadPromise: Promise<Payload> | null = null

/** Direct database access for test setup and for reading emailed tokens. */
export const getPayload = (): Promise<Payload> => {
  process.env.DATABASE_URL = E2E_DATABASE_URL
  process.env.PAYLOAD_SECRET ||= 'e2e-secret'
  process.env.SMTP_HOST = ''
  // Use committed migrations, exactly like production.
  process.env.PAYLOAD_DB_PUSH = 'false'
  payloadPromise ??= (async () => {
    const [{ getPayload: get }, { default: config }] = await Promise.all([
      import('payload'),
      import('../../src/payload.config'),
    ])
    return get({ config })
  })()
  return payloadPromise
}

export const uniqueEmail = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@e2e.test`

/** Reads the confirmation token Payload would have emailed. */
export const getVerificationToken = async (email: string): Promise<string> => {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    showHiddenFields: true,
    limit: 1,
  })
  const token = (docs[0] as { _verificationToken?: string } | undefined)?._verificationToken
  if (!token) throw new Error(`No verification token for ${email}`)
  return token
}

/**
 * Logs in through the form. By default waits until the app has left the login
 * page; pass `expectFailure` when the test checks a refused login.
 */
export const login = async (page: Page, email: string, options: { password?: string; expectFailure?: boolean } = {}) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(options.password ?? PASSWORD)
  await page.getByRole('button', { name: 'Log in' }).click()
  if (!options.expectFailure) await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 })
}

export const logout = async (page: Page) => {
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/login/)
}
