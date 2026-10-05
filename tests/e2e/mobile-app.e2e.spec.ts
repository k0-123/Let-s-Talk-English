import { expect, test, type Locator, type Page } from '@playwright/test'

import { accounts, PASSWORD } from './helpers'

/**
 * The Android/iOS app (mobile/), exported for the web and used at phone size
 * against the same server as the other tests. Run with `npm run test:e2e:app`,
 * which builds the app first; CI runs it with the rest.
 */

/** Screens and tabs the user has left stay mounted underneath, so use the copy that would get the tap. */
const tappable = async (locator: Locator): Promise<Locator> => {
  const visible = locator.filter({ visible: true })
  await expect(visible.first()).toBeVisible()
  const count = await visible.count()
  for (let i = 0; i < count; i++) {
    const candidate = visible.nth(i)
    const receivesTap = await candidate.click({ trial: true, timeout: 1_000 }).then(
      () => true,
      () => false,
    )
    if (receivesTap) return candidate
  }
  return visible.first()
}

const tap = async (locator: Locator) => (await tappable(locator)).click()
const fill = async (locator: Locator, text: string) => (await tappable(locator)).fill(text)

const signIn = async (page: Page, email: string) => {
  await page.goto('/')
  await tap(page.getByRole('button', { name: 'Log in' }))
  await fill(page.getByLabel('Email'), email)
  await fill(page.getByLabel('Password'), PASSWORD)
  await tap(page.getByRole('button', { name: 'Log in' }))
}

const signOut = async (page: Page, tabTestId: string) => {
  await tap(page.getByTestId(tabTestId))
  await tap(page.getByRole('button', { name: 'Log out' }))
  await expect(page.getByRole('button', { name: 'Create an account' })).toBeVisible()
}

test.beforeEach(({ page }) => {
  // "Are you sure?" questions use the browser's confirm() in the web build.
  page.on('dialog', (dialog) => dialog.accept())
})

test('a student practises a set, gets AI feedback, and finds it in their history', async ({ page }) => {
  await signIn(page, accounts.student.email)
  await expect(page.getByRole('heading', { name: 'Hi, Stan' })).toBeVisible()

  await tap(page.getByTestId('tab-practice'))
  await tap(page.getByRole('button', { name: /: [1-9]\d* new sets?$/ }))
  await tap(page.locator('[data-testid^="set-row-"]'))
  const topic = (await (await tappable(page.getByTestId('set-topic'))).textContent())?.trim() ?? ''
  expect(topic).not.toBe('')

  await tap(page.getByRole('button', { name: 'Practise this question' }))
  await fill(page.getByLabel('Your answer in words'), 'I come from a busy city in the north, and I love the street food there.')
  await tap(page.getByRole('button', { name: 'Get AI feedback' }))
  await expect(page.getByLabel(/^Estimated band \d/).filter({ visible: true }).first()).toBeVisible()

  await tap(page.getByRole('radio', { name: '4: Quite' }))
  await tap(page.getByRole('button', { name: 'Mark as practised' }))
  await expect(page.getByText('Saved! This set won’t be offered again in this cycle.')).toBeVisible()

  // Never repeated: the part's next sets no longer include it.
  await tap(page.getByRole('button', { name: 'Next set' }))
  await expect(page.getByTestId('remaining-count').filter({ visible: true }).first()).toBeVisible()
  await expect(page.locator(`[data-testid^="set-row-"][aria-label="${topic}"]`)).toHaveCount(0)

  await tap(page.getByLabel('Go back'))
  await tap(page.getByTestId('tab-history'))
  await expect(page.getByRole('button', { name: new RegExp(`^${topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, `) }).first()).toBeVisible()

  await signOut(page, 'tab-me')
})

test('an educator assigns a set and marks it as covered', async ({ page }) => {
  await signIn(page, accounts.educator.email)
  await expect(page.getByRole('heading', { name: 'Your students' })).toBeVisible()
  // Another educator's student is never listed.
  await expect(page.getByText(accounts.otherStudent.name)).toHaveCount(0)

  await tap(page.getByRole('button', { name: new RegExp(`^${accounts.student.name},`) }))
  await expect(page.getByText(new RegExp(`${accounts.student.email} · cycle \\d+`))).toBeVisible()

  await tap(page.getByRole('button', { name: 'Not done yet' }))
  const firstRow = page.locator('[data-testid^="set-row-"]').filter({ visible: true }).first()
  await expect(firstRow).toBeVisible()
  const setTopic = (await firstRow.getAttribute('aria-label')) ?? ''

  await tap(page.getByRole('checkbox', { name: `Select ${setTopic}` }))
  await expect(page.getByText('1 set selected')).toBeVisible()
  await tap(page.getByRole('button', { name: 'In a week' }))
  await tap(page.getByRole('button', { name: 'Assign 1 set' }))
  // Another test may have assigned it already; either way it is assigned now.
  await expect(page.getByText(/^Assigned \d+ sets?/)).toBeVisible()

  await tap(page.getByRole('button', { name: 'Mark as covered' }))
  await expect(page.getByText(`Marked “${setTopic}” as covered.`)).toBeVisible()
  await expect(page.locator(`[data-testid^="set-row-"][aria-label="${setTopic}"]`)).toHaveCount(0)

  // The assignment is done now, because the set was covered in this cycle.
  await tap(page.getByRole('button', { name: 'Assigned' }))
  await expect(page.getByRole('button', { name: `${setTopic}, done` }).first()).toBeVisible()

  await tap(page.getByLabel('Go back'))
  await signOut(page, 'tab-settings')
})

test('admins are sent to the website', async ({ page }) => {
  await signIn(page, accounts.admin.email)
  await expect(page.getByText(/Admin accounts use the website/)).toBeVisible()
})
