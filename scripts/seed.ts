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
import { fakeReviewer } from '../src/lib/ai-feedback'
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

// --- Demo activity, so every screen has something to show on first run ---
const allSets = (await payload.find({ collection: 'question-sets', where: { status: { equals: 'published' } }, pagination: false, depth: 0 })).docs
const demoStudents = [
  { email: 'student@example.com', name: 'Sam Student', days: [0, 1, 2, 4, 5, 8, 9, 11, 15, 16, 22, 29, 36], confidence: [3, 4, 4, 2, 5] },
  { email: 'priya@example.com', name: 'Priya Sharma', days: [1, 3, 6, 7, 10, 13, 17, 20, 24, 31, 38, 45], confidence: [4, 4, 5] },
  { email: 'arjun@example.com', name: 'Arjun Mehta', days: [10, 12, 19, 26], confidence: [2, 3] },
  { email: 'meera@example.com', name: 'Meera Iyer', days: [30, 44], confidence: [3] },
]
const existingLogs = await payload.count({ collection: 'practice-logs' })
if (existingLogs.totalDocs === 0) {
  let offset = 0
  for (const demo of demoStudents) {
    const s = await ensureUser({ email: demo.email, name: demo.name, role: 'student', educator: educator.id })
    for (const [i, daysAgo] of demo.days.entries()) {
      const set = allSets[(offset + i) % allSets.length]
      const practisedAt = new Date(Date.now() - daysAgo * 86400000 - (i % 3) * 3600000).toISOString()
      await payload
        .create({
          collection: 'practice-logs',
          // Created as the admin so the given date and cycle are kept.
          data: { student: s.id, questionSet: set.id, practisedAt, cycle: 1, markedBy: 'student', confidence: demo.confidence[i % demo.confidence.length], speakingSeconds: 60 + ((i * 37) % 120) },
          user: admin,
        })
        .catch(() => undefined) // duplicate (student, set, cycle): skip
    }
    offset += 3
  }
  const sam = await ensureUser({ email: 'student@example.com', name: 'Sam Student', role: 'student' })
  const samSets = new Set(
    (await payload.find({ collection: 'practice-logs', where: { student: { equals: sam.id } }, pagination: false, depth: 0 })).docs.map((l) =>
      String(l.questionSet),
    ),
  )
  const open = allSets.filter((x) => !samSets.has(x.id)).slice(0, 2)
  for (const [i, set] of open.entries()) {
    await payload.create({
      collection: 'assignments',
      data: { student: sam.id, questionSet: set.id, educator: educator.id, note: i === 0 ? 'Focus on giving reasons and examples.' : null, dueDate: new Date(Date.now() + (i + 2) * 86400000).toISOString() },
    })
  }
  await payload.create({
    collection: 'student-notes',
    data: { student: sam.id, educator: educator.id, body: 'Good fluency in Part 1. Part 2 answers stop after about a minute: practise extending with reasons and a short story.' },
  })
  const firstSet = allSets[0]
  const fake = await fakeReviewer({ categoryName: 'Part 1', topic: firstSet.topic, question: firstSet.questions[0].question, sampleAnswer: firstSet.questions[0].answer ?? null, answer: 'I come from a small city near the river. I like it because the food is great and people are friendly to visitors.' })
  await payload.create({
    collection: 'ai-feedback',
    data: { student: sam.id, questionSet: firstSet.id, questionIndex: 0, question: firstSet.questions[0].question, answerText: 'I come from a small city near the river. I like it because the food is great and people are friendly to visitors.', result: fake.result, model: 'demo' },
  })
}

const educatorDoc = await payload.findByID({ collection: 'users', id: educator.id })
console.log(`Question sets: ${report.created} created, ${report.updated} updated, ${report.failed} failed.`)
console.log(`Demo logins (password "${password}"):`)
console.log('  admin@example.com     -> /admin')
console.log(`  educator@example.com  -> /educator (invite code ${educatorDoc.inviteCode})`)
console.log('  student@example.com   -> /dashboard (also priya@, arjun@, meera@example.com)')
process.exit(0)
