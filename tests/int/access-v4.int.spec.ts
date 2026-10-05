import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { relationId } from '@/access'
import type { Category, QuestionSet, User } from '@/payload-types'
import { createCategory, createSet, createUser, getTestPayload, resetDatabase } from '../helpers/factories'

/** Access rules for the v4 collections: assignments, student notes, AI feedback, and new user fields. */

let payload: Payload
let admin: User
let educatorA: User
let educatorB: User
let studentA: User
let studentB: User
let category: Category
let published: QuestionSet
let draft: QuestionSet

const as = (user: User | null) => ({ overrideAccess: false, user }) as const

beforeAll(async () => {
  payload = await getTestPayload()
  await resetDatabase(payload)
  admin = await createUser(payload, { role: 'admin' })
  educatorA = await createUser(payload, { role: 'educator', approved: true })
  educatorB = await createUser(payload, { role: 'educator', approved: true })
  studentA = await createUser(payload, { role: 'student', educator: educatorA.id })
  studentB = await createUser(payload, { role: 'student', educator: educatorB.id })
  category = await createCategory(payload, 'Part 1')
  published = await createSet(payload, category)
  draft = await createSet(payload, category, { status: 'draft' })
})

afterAll(async () => {
  await resetDatabase(payload)
})

describe('assignments', () => {
  it('an educator assigns a published set to their own student; educator is set by the server', async () => {
    const assignment = await payload.create({
      collection: 'assignments',
      data: { student: studentA.id, questionSet: published.id, educator: educatorB.id, note: 'Try this one' } as never,
      ...as(educatorA),
    })
    expect(relationId(assignment.educator)).toBe(educatorA.id)
  })

  it('cannot assign to another educator’s student, or a draft set', async () => {
    await expect(
      payload.create({ collection: 'assignments', data: { student: studentB.id, questionSet: published.id } as never, ...as(educatorA) }),
    ).rejects.toThrow()
    await expect(
      payload.create({ collection: 'assignments', data: { student: studentA.id, questionSet: draft.id } as never, ...as(educatorA) }),
    ).rejects.toThrow()
  })

  it('students cannot create assignments; they read only their own', async () => {
    await expect(
      payload.create({ collection: 'assignments', data: { student: studentA.id, questionSet: published.id } as never, ...as(studentA) }),
    ).rejects.toThrow()
    const own = await payload.find({ collection: 'assignments', depth: 0, ...as(studentA) })
    expect(own.docs.length).toBe(1)
    const other = await payload.find({ collection: 'assignments', depth: 0, ...as(studentB) })
    expect(other.docs.length).toBe(0)
    const otherEducator = await payload.find({ collection: 'assignments', depth: 0, ...as(educatorB) })
    expect(otherEducator.docs.length).toBe(0)
  })

  it('the same set cannot be assigned twice to a student', async () => {
    await expect(
      payload.create({ collection: 'assignments', data: { student: studentA.id, questionSet: published.id } as never, ...as(educatorA) }),
    ).rejects.toThrow()
  })

  it('another educator cannot edit or delete an assignment', async () => {
    const [assignment] = (await payload.find({ collection: 'assignments', depth: 0, ...as(admin) })).docs
    await expect(
      payload.update({ collection: 'assignments', id: assignment.id, data: { note: 'x' }, ...as(educatorB) }),
    ).rejects.toThrow()
    await expect(payload.delete({ collection: 'assignments', id: assignment.id, ...as(educatorB) })).rejects.toThrow()
    await expect(payload.delete({ collection: 'assignments', id: assignment.id, ...as(studentA) })).rejects.toThrow()
  })
})

describe('student notes', () => {
  it('are private to the educator who wrote them', async () => {
    await payload.create({
      collection: 'student-notes',
      data: { student: studentA.id, body: 'Needs work on Part 2 timing.' } as never,
      ...as(educatorA),
    })
    expect((await payload.find({ collection: 'student-notes', ...as(educatorA) })).docs).toHaveLength(1)
    expect((await payload.find({ collection: 'student-notes', ...as(educatorB) })).docs).toHaveLength(0)
    await expect(payload.find({ collection: 'student-notes', ...as(studentA) })).rejects.toThrow()
  })

  it('cannot be written about another educator’s student', async () => {
    await expect(
      payload.create({ collection: 'student-notes', data: { student: studentB.id, body: 'x' } as never, ...as(educatorA) }),
    ).rejects.toThrow()
  })
})

describe('AI feedback', () => {
  it('nobody but the admin can create rows through the API', async () => {
    const data = {
      student: studentA.id,
      questionSet: published.id,
      questionIndex: 0,
      question: 'Q',
      answerText: 'A',
      result: { estimatedBand: 9 },
    }
    await expect(payload.create({ collection: 'ai-feedback', data, ...as(studentA) })).rejects.toThrow()
    await expect(payload.create({ collection: 'ai-feedback', data, ...as(educatorA) })).rejects.toThrow()
    await payload.create({ collection: 'ai-feedback', data, ...as(admin) })
  })

  it('a student and their educator can read it; others cannot', async () => {
    expect((await payload.find({ collection: 'ai-feedback', ...as(studentA) })).docs).toHaveLength(1)
    expect((await payload.find({ collection: 'ai-feedback', ...as(educatorA) })).docs).toHaveLength(1)
    expect((await payload.find({ collection: 'ai-feedback', ...as(studentB) })).docs).toHaveLength(0)
    expect((await payload.find({ collection: 'ai-feedback', ...as(educatorB) })).docs).toHaveLength(0)
    await expect(payload.find({ collection: 'ai-feedback', ...as(null) })).rejects.toThrow()
  })

  it('cannot be edited, even by its student', async () => {
    const [row] = (await payload.find({ collection: 'ai-feedback', ...as(studentA) })).docs
    await expect(
      payload.update({ collection: 'ai-feedback', id: row.id, data: { result: { estimatedBand: 9 } }, ...as(studentA) }),
    ).rejects.toThrow()
  })
})

describe('user preferences', () => {
  it('a student can set their own weekly goal, theme and onboarding flag', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: studentA.id,
      data: { weeklyGoal: 8, theme: 'dark', onboardingDismissed: true },
      ...as(studentA),
    })
    expect(updated.weeklyGoal).toBe(8)
    expect(updated.theme).toBe('dark')
    expect(updated.onboardingDismissed).toBe(true)
  })

  it('records confidence and speaking time on a practice log', async () => {
    const log = await payload.create({
      collection: 'practice-logs',
      data: { questionSet: published.id, confidence: 4, speakingSeconds: 95 } as never,
      ...as(studentA),
    })
    expect(log.confidence).toBe(4)
    expect(log.speakingSeconds).toBe(95)
  })

  it('deleting a student removes their assignments, notes and feedback', async () => {
    await payload.delete({ collection: 'users', id: studentA.id })
    for (const collection of ['assignments', 'student-notes', 'ai-feedback'] as const) {
      expect((await payload.count({ collection, where: { student: { equals: studentA.id } } })).totalDocs).toBe(0)
    }
  })
})
