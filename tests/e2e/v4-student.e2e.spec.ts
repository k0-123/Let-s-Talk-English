import { expect, test } from '@playwright/test'

import type { User } from '../../src/payload-types'
import { getPayload, login, PASSWORD, uniqueEmail } from './helpers'

const newStudent = async (name: string) => {
  const payload = await getPayload()
  const email = uniqueEmail('v4')
  await payload.create({
    collection: 'users',
    data: { name, email, password: PASSWORD, role: 'student', _verified: true, weeklyGoal: 3 } as User,
    disableVerificationEmail: true,
  })
  return email
}

test.describe('v4 student features', () => {
  test('dashboard tracks the weekly goal, streak and confidence after practising', async ({ page }) => {
    const email = await newStudent('Dina Dashboard')
    await login(page, email)
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('Getting started')).toBeVisible()
    await expect(page.getByRole('img', { name: '0 of 3 sets this week' })).toBeVisible()

    await page.goto('/practice/part-1')
    await page.locator('main ol > li a').first().click()
    await page.getByText('Good', { exact: true }).click() // confidence 4
    await page.getByRole('button', { name: 'Mark as practised' }).click()
    await expect(page.getByText(/Practised on .* It is in your history/)).toBeVisible()

    await page.goto('/dashboard')
    await expect(page.getByRole('img', { name: '1 of 3 sets this week' })).toBeVisible()
    await expect(page.getByText('Practised today')).toBeVisible()
    await expect(page.getByText('4.0 / 5')).toBeVisible()

    await page.goto('/history')
    await expect(page.getByText('Confidence 4/5')).toBeVisible()
  })

  test('Part 2 timer counts down the preparation minute', async ({ page }) => {
    const email = await newStudent('Tim Timer')
    await login(page, email)
    await page.goto('/practice/part-2')
    await page.locator('main ol > li a').first().click()
    await page.getByRole('button', { name: 'Start 1-minute prep' }).click()
    await expect(page.getByText('Prepare', { exact: true })).toBeVisible()
    await expect(page.getByText(/^0:5\d$/)).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Start speaking now' }).click()
    await expect(page.getByText('Speak', { exact: true })).toBeVisible()
    await expect(page.getByText(/^1:5\d$/)).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Finish' }).click()
    await expect(page.getByText('Well done')).toBeVisible()
  })

  test('records an answer with the (fake) microphone and plays it back', async ({ page }) => {
    const email = await newStudent('Rina Recorder')
    await login(page, email)
    await page.goto('/practice/part-1')
    await page.locator('main ol > li a').first().click()
    await page.getByRole('button', { name: 'Record my answer' }).first().click()
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()
    await page.waitForTimeout(1200)
    await page.getByRole('button', { name: 'Stop' }).click()
    await expect(page.locator('audio')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Record again' })).toBeVisible()
  })

  test('gets AI feedback on a typed answer and finds it in history', async ({ page }) => {
    const email = await newStudent('Ali Answer')
    await login(page, email)
    await page.goto('/practice/part-1')
    await page.locator('main ol > li a').first().click()
    await page.getByRole('button', { name: 'Type it' }).first().click()
    const getFeedback = page.getByRole('button', { name: 'Get AI feedback' })
    await expect(getFeedback).toBeDisabled()
    await page.getByPlaceholder('Type what you would say…').fill(
      'I come from a lively city in the south. I love the night market because the food is cheap and delicious.',
    )
    await getFeedback.click()
    // The new card is the first; a saved copy also appears in "Your AI feedback on this set".
    const card = page.getByTestId('feedback-card').first()
    await expect(card).toBeVisible()
    await expect(card).toContainText('A stronger version of your answer')
    await expect(card).toContainText('not an official IELTS score')

    await page.goto('/history/feedback')
    await expect(page.getByText(/feedback requests left today/)).toBeVisible()
    await expect(page.locator('main details')).toHaveCount(1)
  })

  test('theme choice persists across reloads', async ({ page }) => {
    const email = await newStudent('Dark Mode')
    await login(page, email)
    await page.goto('/account')
    await page.getByRole('radio', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.getByRole('radio', { name: 'Light' }).click()
    await page.reload()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('phones get a bottom tab bar', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout only')
    const email = await newStudent('Phil Phone')
    await login(page, email)
    const tabs = page.getByRole('navigation', { name: 'Main' })
    await expect(tabs).toBeVisible()
    await tabs.getByRole('link', { name: 'History' }).click()
    await expect(page).toHaveURL(/\/history$/)
    await expect(tabs.getByRole('link', { name: 'History' })).toHaveAttribute('aria-current', 'page')
  })
})
