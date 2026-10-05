import { expect, test } from '@playwright/test'

import { accounts, getPayload, getVerificationToken, login, PASSWORD, uniqueEmail } from './helpers'

test.describe('Educator journey', () => {
  test('registers, waits for admin approval in the admin panel, then sees the dashboard', async ({ page, browser }) => {
    const email = uniqueEmail('teacher')

    await page.goto('/register?role=educator')
    await expect(page.getByLabel("I'm an educator")).toBeChecked()
    await page.getByLabel('Full name').fill('Terry Teacher')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Confirm password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('Educator accounts are also checked by our team')).toBeVisible()

    await page.goto(`/verify-email?token=${await getVerificationToken(email)}`)
    await login(page, email)
    await expect(page.getByText('Your educator account is waiting for approval')).toBeVisible()

    // The admin approves the educator in the Payload admin panel
    const payload = await getPayload()
    const teacher = (await payload.find({ collection: 'users', where: { email: { equals: email } } })).docs[0]
    const adminPage = await (await browser.newContext()).newPage()
    await login(adminPage, accounts.admin.email)
    await expect(adminPage).toHaveURL(/\/admin/)
    await adminPage.goto(`/admin/collections/users/${teacher.id}`)
    await adminPage.getByLabel('Approved educator').check()
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByText(/successfully/i).first()).toBeVisible()
    await adminPage.close()

    await login(page, email)
    await expect(page).toHaveURL(/\/educator$/)
    await expect(page.getByTestId('invite-code')).toHaveText(/^[A-Z2-9]{6}$/)
    await expect(page.getByText('No students yet')).toBeVisible()
  })

  test('sees only their own students, their history, and can mark a set as covered', async ({ page }) => {
    await login(page, accounts.educator.email)
    await expect(page).toHaveURL(/\/educator$/)
    const main = page.locator('main')
    await expect(main.getByRole('link', { name: accounts.student.name }).first()).toBeVisible()
    await expect(main).not.toContainText(accounts.otherStudent.name)

    await main.getByRole('link', { name: accounts.student.name }).first().click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(accounts.student.name)
    await expect(page.getByText('No sets practised yet.')).toBeVisible()

    await page.getByRole('link', { name: 'Not done yet' }).click()
    await expect(page).toHaveURL(/tab=todo/)
    await page.getByRole('link', { name: 'Part 3', exact: true }).click()
    await expect(page).toHaveURL(/tab=todo&category=part-3/)
    await expect(page.getByText(/6 sets .* has not done in Part 3/)).toBeVisible()
    const firstRow = page.locator('main ul > li').first()
    const topic = (await firstRow.locator('a').textContent())!.trim()
    await firstRow.getByRole('button', { name: 'Mark as covered' }).click()
    await expect(page.getByText(/5 sets .* has not done in Part 3/)).toBeVisible()
    await expect(page.locator('main ul')).not.toContainText(topic)

    await page.getByRole('link', { name: 'History', exact: true }).click()
    await expect(page).not.toHaveURL(/tab=todo/)
    await expect(page.getByRole('link', { name: topic })).toBeVisible()
    await expect(page.getByText('Covered with educator')).toBeVisible()
  })

  test("cannot open another educator's student", async ({ page }) => {
    const payload = await getPayload()
    const other = (await payload.find({ collection: 'users', where: { email: { equals: accounts.otherStudent.email } } })).docs[0]
    await login(page, accounts.educator.email)
    await expect(page).toHaveURL(/\/educator$/)
    await page.goto(`/educator/students/${other.id}`)
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(page.locator('main')).not.toContainText(accounts.otherStudent.name)
  })
})
