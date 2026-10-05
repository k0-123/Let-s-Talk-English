import type { Payload } from 'payload'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  dailyLimit,
  fakeReviewer,
  getAnswerFeedback,
  listFeedback,
  type FeedbackReviewer,
} from '@/lib/ai-feedback'
import { assignSets, listAssignments, removeAssignment } from '@/lib/assignments'
import { listStudentSummaries } from '@/lib/educator'
import { addNote, deleteNote, listNotes } from '@/lib/notes'
import { recordPractice } from '@/lib/practice'
import { getStudentProgress } from '@/lib/progress'
import { getUsageStats } from '@/lib/stats'
import type { Category, QuestionSet, User } from '@/payload-types'
import { createCategory, createSet, createUser, getTestPayload, resetDatabase } from '../helpers/factories'

let payload: Payload
let admin: User
let educator: User
let otherEducator: User
let student: User
let category: Category
let sets: QuestionSet[]

const reload = (user: User) => payload.findByID({ collection: 'users', id: user.id, depth: 0 })
const ANSWER = 'I am from a busy city in the north and I really like the food and the people there.'

beforeEach(async () => {
  payload = await getTestPayload()
  await resetDatabase(payload)
  admin = await createUser(payload, { role: 'admin' })
  educator = await createUser(payload, { role: 'educator', approved: true })
  otherEducator = await createUser(payload, { role: 'educator', approved: true })
  student = await createUser(payload, { role: 'student', educator: educator.id, weeklyGoal: 3 })
  category = await createCategory(payload, 'Part 1')
  sets = []
  for (let i = 0; i < 4; i++) sets.push(await createSet(payload, category, { topic: `Topic ${i}` }))
})

afterEach(() => {
  delete process.env.AI_FAKE
  delete process.env.AI_DAILY_LIMIT
})

afterAll(async () => {
  await resetDatabase(payload)
})

describe('assignments', () => {
  it('assigns sets, skips duplicates, and marks them done when practised', async () => {
    const first = await assignSets(payload, educator, { studentId: student.id, setIds: [sets[0].id, sets[1].id], note: 'For Friday' })
    expect(first).toEqual({ created: 2, skipped: 0 })
    const again = await assignSets(payload, educator, { studentId: student.id, setIds: [sets[1].id, sets[2].id] })
    expect(again).toEqual({ created: 1, skipped: 1 })

    await recordPractice(payload, student, { studentId: student.id, setId: sets[0].id })
    const forStudent = await listAssignments(payload, student)
    expect(forStudent).toHaveLength(3)
    expect(forStudent.find((a) => a.setId === sets[0].id)?.done).toBe(true)
    expect(forStudent.find((a) => a.setId === sets[1].id)?.done).toBe(false)
    expect(forStudent.find((a) => a.setId === sets[1].id)?.note).toBe('For Friday')

    const forEducator = await listAssignments(payload, educator, { studentId: student.id })
    expect(forEducator.find((a) => a.setId === sets[0].id)).toMatchObject({ done: true, studentName: student.name })
  })

  it('a new cycle makes assignments open again; overdue is flagged', async () => {
    await assignSets(payload, educator, { studentId: student.id, setIds: [sets[0].id], dueDate: '2026-01-01' })
    const [open] = await listAssignments(payload, educator, { today: '2026-02-01' })
    expect(open).toMatchObject({ done: false, overdue: true })
    await recordPractice(payload, student, { studentId: student.id, setId: sets[0].id })
    expect((await listAssignments(payload, educator))[0].done).toBe(true)
    await payload.update({ collection: 'users', id: student.id, data: { cycle: 2 } })
    expect((await listAssignments(payload, educator))[0].done).toBe(false)
  })

  it('other educators cannot assign to or remove assignments of this student', async () => {
    await expect(assignSets(payload, otherEducator, { studentId: student.id, setIds: [sets[0].id] })).rejects.toThrow()
    await assignSets(payload, educator, { studentId: student.id, setIds: [sets[0].id] })
    const [assignment] = await listAssignments(payload, educator)
    await expect(removeAssignment(payload, otherEducator, assignment.id)).rejects.toThrow()
    await removeAssignment(payload, educator, assignment.id)
    expect(await listAssignments(payload, educator)).toHaveLength(0)
  })
})

describe('notes', () => {
  it('adds, lists and deletes private notes', async () => {
    const note = await addNote(payload, educator, { studentId: student.id, body: '  Great progress on Part 2.  ' })
    expect(note.body).toBe('Great progress on Part 2.')
    expect(await listNotes(payload, educator, student.id)).toHaveLength(1)
    expect(await listNotes(payload, otherEducator, student.id)).toHaveLength(0)
    await expect(deleteNote(payload, otherEducator, note.id)).rejects.toThrow()
    await deleteNote(payload, educator, note.id)
    expect(await listNotes(payload, educator, student.id)).toHaveLength(0)
    await expect(addNote(payload, educator, { studentId: student.id, body: '   ' })).rejects.toThrow(/Write something/)
  })
})

describe('AI feedback', () => {
  it('is off unless configured', async () => {
    await expect(
      getAnswerFeedback(payload, student, { setId: sets[0].id, questionIndex: 0, answerText: ANSWER }, fakeReviewer),
    ).rejects.toThrow(/not switched on/)
  })

  it('stores structured feedback the student and their educator can read', async () => {
    process.env.AI_FAKE = 'true'
    let seen: Parameters<FeedbackReviewer>[0] | null = null
    const reviewer: FeedbackReviewer = async (req) => {
      seen = req
      return fakeReviewer(req)
    }
    const row = await getAnswerFeedback(payload, student, { setId: sets[0].id, questionIndex: 0, answerText: `  ${ANSWER}\n` }, reviewer)
    expect(row.answerText).toBe(ANSWER)
    expect(seen).toMatchObject({ categoryName: 'Part 1', topic: 'Topic 0', question: 'Do you like your hometown?', sampleAnswer: 'Yes, I do.' })

    const mine = await listFeedback(payload, student, { studentId: student.id })
    expect(mine).toHaveLength(1)
    expect(mine[0].result.estimatedBand).toBeGreaterThan(0)
    expect(await listFeedback(payload, educator, { studentId: student.id })).toHaveLength(1)
    expect(await listFeedback(payload, otherEducator, { studentId: student.id })).toHaveLength(0)
  })

  it('rejects short answers, missing questions, drafts and non-students', async () => {
    process.env.AI_FAKE = 'true'
    const draft = await createSet(payload, category, { status: 'draft' })
    await expect(getAnswerFeedback(payload, student, { setId: sets[0].id, questionIndex: 0, answerText: 'Yes.' }, fakeReviewer)).rejects.toThrow(/a bit more/)
    await expect(getAnswerFeedback(payload, student, { setId: sets[0].id, questionIndex: 5, answerText: ANSWER }, fakeReviewer)).rejects.toThrow(/not found/)
    await expect(getAnswerFeedback(payload, student, { setId: draft.id, questionIndex: 0, answerText: ANSWER }, fakeReviewer)).rejects.toThrow(/not available/)
    await expect(getAnswerFeedback(payload, educator, { setId: sets[0].id, questionIndex: 0, answerText: ANSWER }, fakeReviewer)).rejects.toThrow(/Only students/)
  })

  it('enforces the daily limit', async () => {
    process.env.AI_FAKE = 'true'
    process.env.AI_DAILY_LIMIT = '2'
    expect(dailyLimit()).toBe(2)
    for (let i = 0; i < 2; i++) {
      await getAnswerFeedback(payload, student, { setId: sets[0].id, questionIndex: 0, answerText: ANSWER }, fakeReviewer)
    }
    await expect(
      getAnswerFeedback(payload, student, { setId: sets[0].id, questionIndex: 0, answerText: ANSWER }, fakeReviewer),
    ).rejects.toThrow(/today's 2 feedback requests/)
  })

  it('rejects malformed reviewer output instead of storing it', async () => {
    process.env.AI_FAKE = 'true'
    const broken: FeedbackReviewer = async () => ({ result: { estimatedBand: 'great' } as never, model: 'x', inputTokens: 0, outputTokens: 0 })
    await expect(getAnswerFeedback(payload, student, { setId: sets[0].id, questionIndex: 0, answerText: ANSWER }, broken)).rejects.toThrow()
    expect((await payload.count({ collection: 'ai-feedback' })).totalDocs).toBe(0)
  })
})

describe('progress and summaries', () => {
  it('builds the dashboard numbers for a student', async () => {
    await recordPractice(payload, student, { studentId: student.id, setId: sets[0].id })
    const log = await recordPractice(payload, student, { studentId: student.id, setId: sets[1].id })
    await payload.update({ collection: 'practice-logs', id: log.log.id, data: { confidence: 4 } })

    const progress = await getStudentProgress(payload, student, await reload(student))
    expect(progress.streak).toMatchObject({ current: 1, practisedToday: true })
    expect(progress.thisWeek).toBe(2)
    expect(progress.weeklyGoal).toBe(3)
    expect(progress.totalThisCycle).toBe(2)
    expect(progress.averageConfidence).toBe(4)
    expect(progress.activity).toHaveLength(16 * 7)
    expect(progress.recent[0].setId).toBe(sets[1].id)
  })

  it('educator summaries include weekly counts and status', async () => {
    await recordPractice(payload, student, { studentId: student.id, setId: sets[0].id })
    const quiet = await createUser(payload, { role: 'student', educator: educator.id })
    const summaries = await listStudentSummaries(payload, educator)
    const active = summaries.find((s) => s.id === student.id)!
    expect(active.status).toBe('active')
    expect(active.weekly).toHaveLength(8)
    expect(active.weekly[7]).toBe(1)
    expect(summaries.find((s) => s.id === quiet.id)!.status).toBe('new')
  })

  it('usage stats are admin only and count activity', async () => {
    await recordPractice(payload, student, { studentId: student.id, setId: sets[0].id })
    await createUser(payload, { role: 'educator', approved: false })
    const stats = await getUsageStats(payload, admin)
    expect(stats).toMatchObject({ pendingEducators: 1, students: 1, educators: 2, activeStudents7: 1, practisedAllTime: 1, publishedSets: 4 })
    expect(stats.topCategories).toEqual([{ name: 'Part 1', count: 1 }])
    await expect(getUsageStats(payload, educator)).rejects.toThrow()
  })
})
