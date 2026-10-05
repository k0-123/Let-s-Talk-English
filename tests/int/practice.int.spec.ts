import type { Payload } from 'payload'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import {
  getOwnStudent,
  joinEducatorWithCode,
  listStudentSummaries,
  regenerateInviteCode,
} from '@/lib/educator'
import { NEW_SETS_BATCH_SIZE } from '@/lib/constants'
import {
  findUnpractisedSets,
  getHistory,
  getNextSetsForStudent,
  recordPractice,
  startNewCycle,
} from '@/lib/practice'
import { resetRateLimits } from '@/lib/rate-limit'
import type { Category, QuestionSet, User } from '@/payload-types'
import { createCategory, createSet, createUser, getTestPayload, resetDatabase } from '../helpers/factories'

let payload: Payload
let educator: User
let otherEducator: User
let student: User
let part1: Category
let part2: Category
let part1Sets: QuestionSet[]

const reload = (user: User) => payload.findByID({ collection: 'users', id: user.id, depth: 0 })

beforeEach(async () => {
  payload = await getTestPayload()
  await resetDatabase(payload)
  resetRateLimits()

  await createUser(payload, { role: 'admin' })
  educator = await createUser(payload, { role: 'educator', approved: true })
  otherEducator = await createUser(payload, { role: 'educator', approved: true })
  student = await createUser(payload, { role: 'student', educator: educator.id })

  part1 = await createCategory(payload, 'Part 1', 1)
  part2 = await createCategory(payload, 'Part 2', 2)
  part1Sets = []
  for (let i = 0; i < 7; i++) part1Sets.push(await createSet(payload, part1, { topic: `P1 topic ${i}` }))
  await createSet(payload, part1, { topic: 'P1 draft', status: 'draft' })
  await createSet(payload, part2, { topic: 'P2 topic' })
})

afterAll(async () => {
  await resetDatabase(payload)
})

describe('next sets for a student', () => {
  it('offers a small batch of published sets from the chosen category', async () => {
    const result = await getNextSetsForStudent(payload, student, part1.id)
    expect(result.sets).toHaveLength(NEW_SETS_BATCH_SIZE)
    expect(result.remaining).toBe(7)
    expect(result.sets.map((s) => s.topic)).not.toContain('P1 draft')
    expect(result.sets.map((s) => s.topic)).not.toContain('P2 topic')
    expect(result.sets[0].questionCount).toBe(1)
  })

  it('never offers a practised set again in the same cycle', async () => {
    const first = await getNextSetsForStudent(payload, student, part1.id)
    const practised = first.sets[0]
    const { created } = await recordPractice(payload, student, { studentId: student.id, setId: practised.id })
    expect(created).toBe(true)

    const next = await getNextSetsForStudent(payload, student, part1.id)
    expect(next.remaining).toBe(6)
    expect(next.sets.map((s) => s.id)).not.toContain(practised.id)
  })

  it('recording the same set twice is harmless', async () => {
    const setId = part1Sets[0].id
    const a = await recordPractice(payload, student, { studentId: student.id, setId })
    const b = await recordPractice(payload, student, { studentId: student.id, setId })
    expect(b.created).toBe(false)
    expect(b.log.id).toBe(a.log.id)
    const { totalDocs } = await payload.count({ collection: 'practice-logs' })
    expect(totalDocs).toBe(1)
  })

  it('reaches an empty "all done" state once every set is practised', async () => {
    for (const set of part1Sets) await recordPractice(payload, student, { studentId: student.id, setId: set.id })
    const result = await getNextSetsForStudent(payload, student, part1.id)
    expect(result.sets).toHaveLength(0)
    expect(result.remaining).toBe(0)
    // Other categories are unaffected.
    const p2 = await getNextSetsForStudent(payload, student, part2.id)
    expect(p2.remaining).toBe(1)
  })

  it('a new cycle makes every set new again but keeps the history', async () => {
    for (const set of part1Sets) await recordPractice(payload, student, { studentId: student.id, setId: set.id })
    const newCycle = await startNewCycle(payload, student)
    expect(newCycle).toBe(2)

    const refreshed = await reload(student)
    expect(refreshed.cycle).toBe(2)
    const result = await getNextSetsForStudent(payload, refreshed, part1.id)
    expect(result.remaining).toBe(7)

    const history = await getHistory(payload, refreshed, { studentId: student.id })
    expect(history.totalDocs).toBe(7)
    expect(history.entries.every((e) => e.cycle === 1)).toBe(true)

    // Practising again in cycle 2 is allowed and recorded separately.
    const { created } = await recordPractice(payload, refreshed, { studentId: student.id, setId: part1Sets[0].id })
    expect(created).toBe(true)
  })

  it('refuses to reset an empty cycle', async () => {
    await expect(startNewCycle(payload, student)).rejects.toThrow(/not practised any sets/)
  })
})

describe('history', () => {
  it('lists topic, category and date, newest first, filterable by category', async () => {
    const p2 = (await getNextSetsForStudent(payload, student, part2.id)).sets[0]
    await recordPractice(payload, student, { studentId: student.id, setId: part1Sets[0].id })
    await recordPractice(payload, student, { studentId: student.id, setId: p2.id })

    const all = await getHistory(payload, student, { studentId: student.id })
    expect(all.entries.map((e) => e.topic)).toEqual(['P2 topic', 'P1 topic 0'])
    expect(all.entries[0].categoryId).toBe(part2.id)
    expect(all.entries[0].markedBy).toBe('student')
    expect(new Date(all.entries[0].practisedAt).getTime()).toBeGreaterThan(Date.now() - 60_000)

    const onlyPart1 = await getHistory(payload, student, { studentId: student.id, categoryId: part1.id })
    expect(onlyPart1.entries.map((e) => e.topic)).toEqual(['P1 topic 0'])
  })
})

describe('educator tools', () => {
  it('an educator can mark a set as covered for their student', async () => {
    const { log } = await recordPractice(payload, educator, { studentId: student.id, setId: part1Sets[0].id })
    expect(log.markedBy).toBe('educator')
    const next = await getNextSetsForStudent(payload, student, part1.id)
    expect(next.sets.map((s) => s.id)).not.toContain(part1Sets[0].id)
  })

  it("an educator cannot mark sets for someone else's student", async () => {
    await expect(
      recordPractice(payload, otherEducator, { studentId: student.id, setId: part1Sets[0].id }),
    ).rejects.toThrow(/Student not found/)
    expect(await getOwnStudent(payload, otherEducator, student.id)).toBeNull()
  })

  it('lists sets a student has not done, across categories and paginated', async () => {
    await recordPractice(payload, student, { studentId: student.id, setId: part1Sets[0].id })
    const page1 = await findUnpractisedSets(payload, educator, { student, limit: 5 })
    expect(page1.remaining).toBe(7) // 6 left in Part 1 + 1 in Part 2
    expect(page1.totalPages).toBe(2)
    expect(page1.sets.map((s) => s.id)).not.toContain(part1Sets[0].id)
    const filtered = await findUnpractisedSets(payload, educator, { student, categoryId: part2.id, limit: 5 })
    expect(filtered.remaining).toBe(1)
  })

  it('summarises each student with sets done and last active date', async () => {
    const quiet = await createUser(payload, { role: 'student', educator: educator.id, name: 'Quiet student' })
    await createUser(payload, { role: 'student', educator: otherEducator.id })
    await recordPractice(payload, student, { studentId: student.id, setId: part1Sets[0].id })
    await recordPractice(payload, student, { studentId: student.id, setId: part1Sets[1].id })

    const summaries = await listStudentSummaries(payload, educator)
    expect(summaries.map((s) => s.id).sort()).toEqual([student.id, quiet.id].sort())
    const active = summaries.find((s) => s.id === student.id)!
    expect(active.setsThisCycle).toBe(2)
    expect(active.setsAllTime).toBe(2)
    expect(active.lastActive).toBeTruthy()
    expect(summaries.find((s) => s.id === quiet.id)!.lastActive).toBeNull()
  })
})

describe('invite codes', () => {
  it('a student joins an approved educator with their code', async () => {
    const newcomer = await createUser(payload, { role: 'student' })
    const code = (await payload.findByID({ collection: 'users', id: otherEducator.id })).inviteCode!
    const { educatorName } = await joinEducatorWithCode(payload, newcomer, ` ${code.toLowerCase().slice(0, 3)}-${code.slice(3)} `)
    expect(educatorName).toBe(otherEducator.name)
    const linked = await reload(newcomer)
    expect(linked.educator).toBe(otherEducator.id)
    expect(await getOwnStudent(payload, otherEducator, newcomer.id)).not.toBeNull()
  })

  it('rejects unknown codes and codes of unapproved educators', async () => {
    const pending = await createUser(payload, { role: 'educator', approved: false })
    const pendingCode = (await payload.findByID({ collection: 'users', id: pending.id })).inviteCode!
    await expect(joinEducatorWithCode(payload, student, 'ZZZZZZ')).rejects.toThrow(/not recognised/)
    await expect(joinEducatorWithCode(payload, student, pendingCode)).rejects.toThrow(/not recognised/)
  })

  it('an educator can replace their code, and the old one stops working', async () => {
    const oldCode = (await payload.findByID({ collection: 'users', id: educator.id })).inviteCode!
    const newCode = await regenerateInviteCode(payload, educator)
    expect(newCode).not.toBe(oldCode)
    const newcomer = await createUser(payload, { role: 'student' })
    await expect(joinEducatorWithCode(payload, newcomer, oldCode)).rejects.toThrow(/not recognised/)
    await expect(joinEducatorWithCode(payload, newcomer, newCode)).resolves.toBeTruthy()
  })

  it('only students can join', async () => {
    const code = (await payload.findByID({ collection: 'users', id: educator.id })).inviteCode!
    await expect(joinEducatorWithCode(payload, otherEducator, code)).rejects.toThrow(/Only students/)
  })
})
