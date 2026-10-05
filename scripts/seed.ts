/**
 * Seeds a development or staging database:
 *   - the three IELTS Speaking categories (Part 1, 2, 3)
 *   - the 20 sample question sets in data/sample-question-sets.csv (published)
 *   - demo accounts: admin, an approved educator, and a student linked to them
 *
 *   npm run seed
 *
 * Safe to run again: existing accounts are left alone and sets are updated by code.
 * Never run against production with the default demo passwords.
 */
import 'dotenv/config'

import { readFileSync } from 'fs'
import path from 'path'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { importQuestionSets } from '../src/lib/import/run'
import { parseImportFile } from '../src/lib/import/parse'
import type { User } from '../src/payload-types'

if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
  console.error('Refusing to seed with NODE_ENV=production. Pass --force if you really mean it.')
  process.exit(1)
}

const payload = await getPayload({ config })
const password = process.env.SEED_PASSWORD || 'Password123!'

const categories = [
  { name: 'Part 1', slug: 'part-1', order: 1, description: 'Introduction and interview: short questions about everyday topics.' },
  { name: 'Part 2', slug: 'part-2', order: 2, description: 'Long turn: speak for two minutes about a cue card.' },
  { name: 'Part 3', slug: 'part-3', order: 3, description: 'Discussion: deeper questions linked to the Part 2 topic.' },
]
for (const category of categories) {
  const existing = await payload.find({ collection: 'categories', where: { slug: { equals: category.slug } }, limit: 1 })
  if (existing.totalDocs === 0) await payload.create({ collection: 'categories', data: category })
}

const ensureUser = async (data: Partial<User> & Pick<User, 'email' | 'name' | 'role'>): Promise<User> => {
  const existing = await payload.find({ collection: 'users', where: { email: { equals: data.email } }, limit: 1 })
  if (existing.docs[0]) return existing.docs[0]
  return payload.create({
    collection: 'users',
    data: { password, _verified: true, ...data } as User,
    disableVerificationEmail: true,
  })
}

const admin = await ensureUser({ email: 'admin@example.com', name: 'Admin', role: 'admin' })
const educator = await ensureUser({ email: 'educator@example.com', name: 'Emma Educator', role: 'educator', approved: true })
await ensureUser({ email: 'student@example.com', name: 'Sam Student', role: 'student', educator: educator.id })

const csv = readFileSync(path.resolve('data/sample-question-sets.csv'), 'utf8')
const report = await importQuestionSets(payload, admin, parseImportFile('sample.csv', csv), {
  dryRun: false,
  defaultStatus: 'published',
  createMissingCategories: false,
})

const educatorDoc = await payload.findByID({ collection: 'users', id: educator.id })
console.log(`Question sets: ${report.created} created, ${report.updated} updated, ${report.failed} failed.`)
console.log(`Demo logins (password "${password}"):`)
console.log('  admin@example.com     -> /admin')
console.log(`  educator@example.com  -> /educator (invite code ${educatorDoc.inviteCode})`)
console.log('  student@example.com   -> /practice')
process.exit(0)
