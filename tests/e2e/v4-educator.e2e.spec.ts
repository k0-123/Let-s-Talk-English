import { expect, test } from '@playwright/test'

import type { User } from '../../src/payload-types'
import { accounts, getPayload, login, PASSWORD, uniqueEmail } from './helpers'

test.describe('v4 educator and admin features', () => {
  test('assigns a set; the student sees it and completing it marks it done', async ({ page, browser }) => {
    const payload = await getPayload()
    const educator = (await payload.find({ collection: 'users', where: { email: { equals: accounts.educator.email } } })).docs[0]
    const email = uniqueEmail('assignee')
    await payload.create({
      collection: 'users',
      data: { name: 'Asha Assignee', email, password: PASSWORD, role: 'student', _verified: true, educator: educator.id } as User,
      disableVerificationEmail: true,
    })
    const student = (await payload.find({ collection: 'users', where: { email: { equals: email } } })).docs[0]

    await login(page, accounts.educator.email)
    await page.goto(`/educator/students/${student.id}?tab=todo&category=part-1`)
    const firstRow = page.locator('main form ul > li').first()
    const topic = (await firstRow.locator('a').first().textContent())!.trim()
    await firstRow.getByRole('checkbox').check()
    await page.getByPlaceholder('e.g. Focus on giving reasons').fill('Use one example per answer')
    await page.getByRole('button', { name: 'Assign' }).click()
    await expect(page.getByText('1 set assigned.')).toBeVisible()

    // The student sees the assignment first on their home screen.
    const studentPage = await (await browser.newContext()).newPage()
    await login(studentPage, email)
    await expect(studentPage.getByText('Assigned by your educator')).toBeVisible()
    await expect(studentPage.getByText('Use one example per answer')).toBeVisible()
    await studentPage.getByRole('link', { name: 'Start your assignment' }).click()
    await expect(studentPage.getByRole('heading', { level: 1 })).toHaveText(topic)
    await studentPage.getByRole('button', { name: 'Mark as practised' }).click()
    await expect(studentPage.getByText(/Practised on/)).toBeVisible()
    await studentPage.close()

    await page.goto('/educator/assignments?show=done')
    await expect(page.getByRole('link', { name: topic })).toBeVisible()
  })

  test('keeps private notes and exports progress as CSV', async ({ page }) => {
    const payload = await getPayload()
    const student = (await payload.find({ collection: 'users', where: { email: { equals: accounts.student.email } } })).docs[0]
    await login(page, accounts.educator.email)
    await page.goto(`/educator/students/${student.id}?tab=notes`)
    await page.getByLabel('Add a private note').fill('Works best with short, timed drills.')
    await page.getByRole('button', { name: 'Save note' }).click()
    await expect(page.locator('main li').filter({ hasText: 'Works best with short, timed drills.' })).toBeVisible()

    const csv = await page.evaluate(() => fetch('/educator/export').then((r) => r.text()))
    expect(csv.split('\r\n')[0]).toContain('Name,Email,Status')
    expect(csv).toContain(accounts.student.email)
    expect(csv).not.toContain(accounts.otherStudent.email)

    const history = await page.evaluate((id) => fetch(`/educator/students/${id}/export`).then((r) => r.status), student.id)
    expect(history).toBe(200)
    const other = (await payload.find({ collection: 'users', where: { email: { equals: accounts.otherStudent.email } } })).docs[0]
    const forbidden = await page.evaluate((id) => fetch(`/educator/students/${id}/export`).then((r) => r.status), other.id)
    expect(forbidden).toBe(404)
  })

  test('the admin dashboard shows usage numbers', async ({ page }) => {
    await login(page, accounts.admin.email)
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
    await expect(page.getByText('Educators waiting for approval')).toBeVisible()
    await expect(page.getByText('Published sets')).toBeVisible()
  })
})
