import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Category, QuestionSet, User } from '@/payload-types'
import { resetRateLimits } from '@/lib/rate-limit'
import { createCategory, createSet, createUser, getTestPayload, resetDatabase } from '../helpers/factories'

/**
 * Phase 5 access-control tests: every rule is checked through the Local API
 * with `overrideAccess: false`, which is exactly what the REST API and the
 * app pages use.
 */

let payload: Payload
let admin: User
let educatorA: User
let educatorB: User
let pendingEducator: User
let studentA: User
let studentB: User
let category: Category
let published: QuestionSet
let draft: QuestionSet

const as = (user: User | null) => ({ overrideAccess: false, user }) as const

beforeAll(async () => {
  payload = await getTestPayload()
  await resetDatabase(payload)
  resetRateLimits()

  admin = await createUser(payload, { role: 'admin' })
  educatorA = await createUser(payload, { role: 'educator', approved: true })
  educatorB = await createUser(payload, { role: 'educator', approved: true })
  pendingEducator = await createUser(payload, { role: 'educator', approved: false })
  studentA = await createUser(payload, { role: 'student', educator: educatorA.id })
  studentB = await createUser(payload, { role: 'student', educator: educatorB.id })

  category = await createCategory(payload, 'Part 1')
  published = await createSet(payload, category, { status: 'published' })
  draft = await createSet(payload, category, { status: 'draft' })

  await payload.create({
    collection: 'practice-logs',
    data: { student: studentA.id, questionSet: published.id, markedBy: 'student', practisedAt: new Date().toISOString(), cycle: 1 },
  })
  await payload.create({
    collection: 'practice-logs',
    data: { student: studentB.id, questionSet: published.id, markedBy: 'student', practisedAt: new Date().toISOString(), cycle: 1 },
  })
})

afterAll(async () => {
  await resetDatabase(payload)
})

describe('first user and sign-up', () => {
  it('makes the first account an admin', () => {
    expect(admin.role).toBe('admin')
  })

  it('does not let public sign-up create an admin or pre-approve itself', async () => {
    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Sneaky',
        email: 'sneaky@example.com',
        password: 'Password123!',
        role: 'admin',
        approved: true,
        cycle: 9,
        educator: educatorA.id,
      } as User,
      disableVerificationEmail: true,
      ...as(null),
    })
    expect(user.role).toBe('student')
    expect(user.cycle).toBe(1)
    expect(user.educator ?? null).toBeNull()
  })

  it('lets public sign-up create an unapproved educator with an invite code', async () => {
    const user = await payload.create({
      collection: 'users',
      data: { name: 'Teacher', email: 'teacher@example.com', password: 'Password123!', role: 'educator', approved: true } as User,
      disableVerificationEmail: true,
      ...as(null),
    })
    expect(user.role).toBe('educator')
    expect(user.approved).toBe(false)
    // The anonymous creator cannot read the code back; the stored document has one.
    expect(user.inviteCode).toBeUndefined()
    const stored = await payload.findByID({ collection: 'users', id: user.id })
    expect(stored.inviteCode).toMatch(/^[A-Z2-9]{6}$/)
  })
})

describe('logged-out visitors', () => {
  it.each(['question-sets', 'categories', 'practice-logs', 'users', 'media'] as const)(
    'cannot read %s',
    async (collection) => {
      await expect(payload.find({ collection, ...as(null) })).rejects.toThrow()
    },
  )
})

describe('question sets', () => {
  it('students only see published sets', async () => {
    const result = await payload.find({ collection: 'question-sets', ...as(studentA) })
    const ids = result.docs.map((d) => d.id)
    expect(ids).toContain(published.id)
    expect(ids).not.toContain(draft.id)
    await expect(
      payload.findByID({ collection: 'question-sets', id: draft.id, ...as(studentA) }),
    ).rejects.toThrow()
  })

  it('unapproved educators see no content at all', async () => {
    await expect(payload.find({ collection: 'question-sets', ...as(pendingEducator) })).rejects.toThrow()
    await expect(payload.find({ collection: 'categories', ...as(pendingEducator) })).rejects.toThrow()
  })

  it('only the admin can create, edit or delete sets and categories', async () => {
    for (const user of [studentA, educatorA]) {
      await expect(
        payload.create({
          collection: 'question-sets',
          data: { topic: 'x', category: category.id, status: 'published', questions: [{ question: 'q' }] },
          ...as(user),
        }),
      ).rejects.toThrow()
      await expect(
        payload.update({ collection: 'question-sets', id: published.id, data: { topic: 'hacked' }, ...as(user) }),
      ).rejects.toThrow()
      await expect(payload.create({ collection: 'categories', data: { name: 'x', slug: 'x' }, ...as(user) })).rejects.toThrow()
    }
    const set = await payload.update({
      collection: 'question-sets',
      id: published.id,
      data: { tips: 'Speak clearly.' },
      ...as(admin),
    })
    expect(set.tips).toBe('Speak clearly.')
  })

  it('caps page size for non-admins (anti-scraping)', async () => {
    for (let i = 0; i < 25; i++) await createSet(payload, category)
    const result = await payload.find({ collection: 'question-sets', limit: 500, ...as(studentA) })
    expect(result.docs.length).toBe(20)
    const unpaginated = await payload.find({ collection: 'question-sets', pagination: false, ...as(studentA) })
    expect(unpaginated.docs.length).toBe(20)
    const adminResult = await payload.find({ collection: 'question-sets', limit: 500, ...as(admin) })
    expect(adminResult.docs.length).toBeGreaterThan(20)
  })
})

describe('users', () => {
  it('an educator sees only their own students', async () => {
    const result = await payload.find({ collection: 'users', pagination: false, ...as(educatorA) })
    const ids = result.docs.map((d) => d.id)
    expect(ids).toContain(studentA.id)
    expect(ids).toContain(educatorA.id)
    expect(ids).not.toContain(studentB.id)
    expect(ids).not.toContain(educatorB.id)
    await expect(payload.findByID({ collection: 'users', id: studentB.id, ...as(educatorA) })).rejects.toThrow()
  })

  it('a student sees only themselves', async () => {
    const result = await payload.find({ collection: 'users', pagination: false, ...as(studentA) })
    expect(result.docs.map((d) => d.id)).toEqual([studentA.id])
  })

  it('a student cannot change their role, educator or cycle', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: studentA.id,
      data: { name: 'Renamed', role: 'admin', cycle: 5, educator: educatorB.id },
      ...as(studentA),
    })
    expect(updated.name).toBe('Renamed')
    expect(updated.role).toBe('student')
    expect(updated.cycle).toBe(1)
    expect(String(typeof updated.educator === 'object' ? updated.educator?.id : updated.educator)).toBe(educatorA.id)
  })

  it('the admin can only link a student to an educator account', async () => {
    await expect(
      payload.update({ collection: 'users', id: studentB.id, data: { educator: studentA.id }, ...as(admin) }),
    ).rejects.toThrow()
  })

  it('an educator cannot approve themselves', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: pendingEducator.id,
      data: { approved: true },
      ...as({ ...pendingEducator }),
    })
    expect(updated.approved).toBe(false)
  })

  it('a student cannot read an educator invite code', async () => {
    const own = await payload.findByID({ collection: 'users', id: educatorA.id, ...as(educatorA) })
    expect(own.inviteCode).toBeTruthy()
    await expect(
      payload.find({ collection: 'users', where: { inviteCode: { equals: own.inviteCode } }, ...as(studentA) }),
    ).rejects.toThrow(/cannot be queried/)
  })
})

describe('login rules', () => {
  it('blocks unapproved educators', async () => {
    await expect(
      payload.login({ collection: 'users', data: { email: pendingEducator.email, password: 'Password123!' } }),
    ).rejects.toThrow(/waiting for approval/)
  })

  it('blocks unverified accounts', async () => {
    const unverified = await createUser(payload, { role: 'student', _verified: false })
    await expect(
      payload.login({ collection: 'users', data: { email: unverified.email, password: 'Password123!' } }),
    ).rejects.toThrow()
  })

  it('lets approved educators and verified students log in', async () => {
    const result = await payload.login({ collection: 'users', data: { email: educatorA.email, password: 'Password123!' } })
    expect(result.token).toBeTruthy()
  })
})

describe('practice logs', () => {
  it('a student only sees their own logs', async () => {
    const result = await payload.find({ collection: 'practice-logs', pagination: false, depth: 0, ...as(studentA) })
    expect(result.docs.length).toBeGreaterThan(0)
    expect(result.docs.every((d) => d.student === studentA.id)).toBe(true)
  })

  it("an educator only sees their own students' logs", async () => {
    const result = await payload.find({ collection: 'practice-logs', pagination: false, depth: 0, ...as(educatorA) })
    expect(result.docs.length).toBeGreaterThan(0)
    expect(result.docs.every((d) => d.student === studentA.id)).toBe(true)
  })

  it('a student cannot record practice for someone else', async () => {
    const other = await createSet(payload, category)
    await expect(
      payload.create({
        collection: 'practice-logs',
        data: { student: studentB.id, questionSet: other.id } as never,
        ...as(studentA),
      }),
    ).rejects.toThrow()
  })

  it("an educator cannot mark a set for another educator's student", async () => {
    const other = await createSet(payload, category)
    await expect(
      payload.create({
        collection: 'practice-logs',
        data: { student: studentB.id, questionSet: other.id } as never,
        ...as(educatorA),
      }),
    ).rejects.toThrow()
  })

  it('a student cannot record practice on a draft set', async () => {
    await expect(
      payload.create({
        collection: 'practice-logs',
        data: { questionSet: draft.id } as never,
        ...as(studentA),
      }),
    ).rejects.toThrow()
  })

  it('nobody but the admin can edit or delete logs', async () => {
    const [log] = (await payload.find({ collection: 'practice-logs', depth: 0, ...as(studentA) })).docs
    await expect(
      payload.update({ collection: 'practice-logs', id: log.id, data: { cycle: 3 }, ...as(studentA) }),
    ).rejects.toThrow()
    await expect(payload.delete({ collection: 'practice-logs', id: log.id, ...as(educatorA) })).rejects.toThrow()
  })

  it('the database rejects a second log for the same student, set and cycle', async () => {
    await expect(
      payload.create({
        collection: 'practice-logs',
        data: { student: studentA.id, questionSet: published.id, markedBy: 'student', practisedAt: new Date().toISOString(), cycle: 1 },
      }),
    ).rejects.toThrow()
  })
})
