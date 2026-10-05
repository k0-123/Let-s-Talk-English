import { expect, test } from '@playwright/test'

import { accounts, login } from './helpers'

test.describe('Access control', () => {
  test('logged-out visitors cannot see any content', async ({ page, request }) => {
    for (const path of ['/practice', '/history', '/educator', '/import']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    }
    for (const path of ['/api/question-sets', '/api/categories', '/api/practice-logs', '/api/users']) {
      const response = await request.get(path)
      expect(response.status(), path).toBe(403)
    }
  })

  test('a student cannot open educator or admin pages', async ({ page }) => {
    await login(page, accounts.student.email)
    await expect(page).toHaveURL(/\/practice$/)
    await page.goto('/educator')
    await expect(page).toHaveURL(/\/practice$/)
    await page.goto('/import')
    await expect(page).toHaveURL(/\/practice$/)
    // Use the browser's own fetch: Payload only accepts the login cookie from same-site browser requests (CSRF).
    const body = await page.evaluate(() => fetch('/api/users?limit=100').then((r) => r.json()))
    expect(body.docs.map((u: { email: string }) => u.email)).toEqual([accounts.student.email])
  })

  test('the API rejects the login cookie when sent by a non-browser client (CSRF)', async ({ page }) => {
    await login(page, accounts.student.email)
    await expect(page).toHaveURL(/\/practice$/)
    const response = await page.request.get('/api/users')
    expect(response.status()).toBe(403)
  })

  test('the API gives non-admins small pages only', async ({ page }) => {
    await login(page, accounts.student.email)
    await expect(page).toHaveURL(/\/practice$/)
    const body = await page.evaluate(() => fetch('/api/question-sets?limit=1000').then((r) => r.json()))
    expect(body.totalDocs).toBe(20)
    expect(body.docs.length).toBe(20)
    const drafts = await page.evaluate(() =>
      fetch('/api/question-sets?where[status][equals]=draft').then((r) => r.json()),
    )
    expect(drafts.docs).toHaveLength(0)
  })
})
