import { expect, test } from '@playwright/test'

import { accounts, getPayload, login } from './helpers'

test.describe('Admin journey', () => {
  test('logs in to the admin panel and sees the question sets', async ({ page }) => {
    await login(page, accounts.admin.email)
    await expect(page).toHaveURL(/\/admin/)
    await page.goto('/admin/collections/question-sets')
    await expect(page.getByRole('heading', { name: 'Question sets' }).first()).toBeVisible()
    await expect(page.getByText('Hometown').first()).toBeVisible()
  })

  test('bulk-imports a CSV: checks it first, reports bad rows, then imports the good ones', async ({ page }) => {
    const code = `E2E-${Date.now()}`
    const csv = [
      'code,category,topic,question_1,answer_1,vocabulary',
      `${code},Part 1,Imported in E2E,What is your favourite season?,Autumn.,crisp - cool and fresh`,
      `${code}-B,Part 7,Bad category,Question?,,`,
    ].join('\n')

    await login(page, accounts.admin.email)
    await expect(page).toHaveURL(/\/admin/)
    await page.goto('/import')
    await page.getByLabel('File (.csv or .json)').setInputFiles({
      name: 'sets.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv),
    })
    await page.getByRole('button', { name: 'Check file' }).click()
    await expect(page.getByText('Check results (nothing saved yet)')).toBeVisible()
    await expect(page.getByText('Category "Part 7" does not exist')).toBeVisible()

    const payload = await getPayload()
    expect((await payload.find({ collection: 'question-sets', where: { code: { equals: code } } })).totalDocs).toBe(0)

    await page.getByLabel('File (.csv or .json)').setInputFiles({
      name: 'sets.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv),
    })
    await page.getByLabel('Status for new sets').selectOption('published')
    await page.getByRole('button', { name: 'Import' }).click()
    await expect(page.getByText('Import finished')).toBeVisible()

    const imported = await payload.find({ collection: 'question-sets', where: { code: { equals: code } } })
    expect(imported.totalDocs).toBe(1)
    expect(imported.docs[0].status).toBe('published')
    expect(imported.docs[0].vocabulary?.[0]).toMatchObject({ term: 'crisp', meaning: 'cool and fresh' })
  })
})
