import { expect, test } from '@playwright/test'

import type { User } from '../../src/payload-types'
import { accounts, getPayload, getVerificationToken, login, PASSWORD, uniqueEmail } from './helpers'

test.describe('Student journey', () => {
  test('registers, confirms email, joins an educator, practises a set and sees it in history', async ({ page }) => {
    const email = uniqueEmail('student')

    // Register
    await page.goto('/register')
    await page.getByLabel('Full name').fill('Nina Newcomer')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Confirm password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/register\/check-email/)

    // Cannot log in before confirming the email
    await login(page, email)
    await expect(page.getByText('Please confirm your email address first')).toBeVisible()

    // Confirm via the emailed link, then log in
    await page.goto(`/verify-email?token=${await getVerificationToken(email)}`)
    await expect(page).toHaveURL(/\/login\?verified=1/)
    await login(page, email)
    await expect(page).toHaveURL(/\/practice$/)

    // Join the educator with their invite code (case and spaces do not matter)
    const payload = await getPayload()
    const educator = (await payload.find({ collection: 'users', where: { email: { equals: accounts.educator.email } } })).docs[0]
    await page.getByRole('link', { name: 'Join my educator' }).click()
    await page.getByLabel('Invite code').fill(` ${educator.inviteCode!.toLowerCase()} `)
    await page.getByRole('button', { name: 'Join' }).click()
    await expect(page.getByText(`You have joined ${accounts.educator.name}`)).toBeVisible()

    // Pick a category and get a small batch of new sets
    await page.goto('/practice')
    await page.getByRole('link', { name: /^Part 1/ }).click()
    const sets = page.locator('main ol > li a')
    await expect(sets).toHaveCount(5)
    const topic = (await sets.first().getByTestId('set-topic').textContent())!.trim()
    await sets.first().click()

    // Questions first, answers revealed on tap
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(topic)
    const firstAnswer = page.locator('details').first()
    await expect(firstAnswer).not.toHaveAttribute('open', '')
    await firstAnswer.locator('summary').click()
    await expect(firstAnswer).toHaveAttribute('open', '')

    // Mark as practised
    await page.getByRole('button', { name: 'Mark as practised' }).click()
    await expect(page.getByText(/Practised on .* It is in your history/)).toBeVisible()
    await page.getByRole('link', { name: 'Next set' }).click()

    // The practised set is never offered again
    await expect(page.locator('main ol')).toBeVisible()
    await expect(page.locator('main ol')).not.toContainText(topic)
    await expect(page.getByText('7 new sets left in this category')).toBeVisible()

    // And it is in the history with today's date
    await page.goto('/history')
    await expect(page.getByRole('link', { name: topic })).toBeVisible()
    await expect(page.getByText('1 set practised so far.')).toBeVisible()
  })

  test('sees an "all done" state and can start a new cycle', async ({ page }) => {
    const payload = await getPayload()
    const email = uniqueEmail('finisher')
    const student = (await payload.create({
      collection: 'users',
      data: { name: 'Fiona Finisher', email, password: PASSWORD, role: 'student', _verified: true } as User,
      disableVerificationEmail: true,
    })) as User
    const part2 = (await payload.find({ collection: 'categories', where: { slug: { equals: 'part-2' } } })).docs[0]
    const sets = await payload.find({ collection: 'question-sets', where: { category: { equals: part2.id } }, pagination: false })
    for (const set of sets.docs) {
      await payload.create({
        collection: 'practice-logs',
        data: { student: student.id, questionSet: set.id, markedBy: 'student', cycle: 1, practisedAt: new Date().toISOString() },
      })
    }

    await login(page, email)
    await expect(page).toHaveURL(/\/practice$/)
    await expect(page.getByRole('link', { name: /^Part 2/ })).toContainText('All sets practised')
    await page.getByRole('link', { name: /^Part 2/ }).click()
    await expect(page.getByRole('heading', { name: 'You have practised every set in Part 2' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Practise Part 1/ })).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Start a new practice cycle' }).click()
    await expect(page).toHaveURL(/\/practice\?newCycle=1/)
    await expect(page.getByText('A new practice cycle has started')).toBeVisible()
    await expect(page.getByRole('link', { name: /^Part 2/ })).toContainText('6 new sets of 6')

    // History from the first cycle is kept
    await page.goto('/history')
    await expect(page.getByText('You are on practice cycle 2.')).toBeVisible()
    await expect(page.getByText('Cycle 1').first()).toBeVisible()
  })
})
