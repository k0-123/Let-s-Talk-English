import { readFileSync } from 'fs'
import path from 'path'

import { importQuestionSets } from '../../src/lib/import/run'
import { parseImportFile } from '../../src/lib/import/parse'
import type { User } from '../../src/payload-types'
import { accounts, getPayload, PASSWORD } from './helpers'

/**
 * Fresh database built from the committed migrations (which also proves they
 * match the collections), with the 20 sample sets and one account per role.
 */
export default async function globalSetup() {
  const payload = await getPayload()
  await payload.db.migrateFresh({ forceAcceptWarning: true })

  const create = (data: Partial<User> & Pick<User, 'email' | 'name' | 'role'>) =>
    payload.create({
      collection: 'users',
      data: { password: PASSWORD, _verified: true, ...data } as User,
      disableVerificationEmail: true,
    })

  const admin = await create({ ...accounts.admin, role: 'admin' })
  const educator = await create({ ...accounts.educator, role: 'educator', approved: true })
  const otherEducator = await create({ ...accounts.otherEducator, role: 'educator', approved: true })
  await create({ ...accounts.student, role: 'student', educator: educator.id })
  await create({ ...accounts.otherStudent, role: 'student', educator: otherEducator.id })

  for (const [order, name] of ['Part 1', 'Part 2', 'Part 3'].entries()) {
    await payload.create({ collection: 'categories', data: { name, slug: '', order: order + 1 } })
  }
  const csv = readFileSync(path.resolve('data/sample-question-sets.csv'), 'utf8')
  const report = await importQuestionSets(payload, admin, parseImportFile('sample.csv', csv), {
    dryRun: false,
    defaultStatus: 'published',
    createMissingCategories: false,
  })
  if (report.created !== 20) throw new Error(`Seeding imported ${report.created} sets, expected 20`)
}
