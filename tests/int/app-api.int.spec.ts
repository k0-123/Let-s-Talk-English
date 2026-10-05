import { createLocalReq, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { appEndpoints } from '@/endpoints/app'
import type { Category, QuestionSet, User } from '@/payload-types'
import { createCategory, createSet, createUser, getTestPayload, resetDatabase } from '../helpers/factories'

/**
 * The mobile app's API (/api/app/*). Each endpoint is called the way Payload
 * calls it, with a request for the given user.
 */

let payload: Payload
let educator: User
let otherEducator: User
let pendingEducator: User
let student: User
let otherStudent: User
let admin: User
let category: Category
let sets: QuestionSet[]

const call = async (
  method: string,
  path: string,
  options: { user?: User | null; params?: Record<string, string>; query?: Record<string, string>; body?: Record<string, unknown> } = {},
): Promise<{ status: number; body: any }> => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const endpoint = appEndpoints.find((e) => e.method === method && e.path === `/app${path}`)
  if (!endpoint) throw new Error(`No endpoint ${method} ${path}`)
  const req = await createLocalReq({ user: (options.user ?? undefined) as never }, payload)
  if (!options.user) req.user = null
  req.routeParams = options.params ?? {}
  Object.defineProperty(req, 'searchParams', { value: new URLSearchParams(options.query ?? {}) })
  req.data = options.body ?? {}
  const response = await endpoint.handler(req)
  return { status: response.status, body: await response.json() }
}

beforeAll(async () => {
  payload = await getTestPayload()
  await resetDatabase(payload)
  admin = await createUser(payload, { role: 'admin' })
  educator = await createUser(payload, { role: 'educator', approved: true })
  otherEducator = await createUser(payload, { role: 'educator', approved: true })
  pendingEducator = await createUser(payload, { role: 'educator', approved: false })
  student = await createUser(payload, { role: 'student', educator: educator.id })
  otherStudent = await createUser(payload, { role: 'student', educator: otherEducator.id })
  category = await createCategory(payload, 'Part 1', 1)
  sets = []
  for (let i = 0; i < 3; i++) sets.push(await createSet(payload, category, { topic: `App topic ${i}` }))
})

afterAll(async () => {
  await resetDatabase(payload)
})

describe('authentication and roles', () => {
  it('requires a login', async () => {
    expect((await call('get', '/me')).status).toBe(401)
  })

  it('refuses admins, pending educators and wrong roles', async () => {
    expect((await call('get', '/me', { user: admin })).status).toBe(403)
    expect((await call('get', '/me', { user: pendingEducator })).body.error).toMatch(/waiting for approval/)
    expect((await call('get', '/student/dashboard', { user: educator })).status).toBe(403)
    expect((await call('get', '/educator/students', { user: student })).status).toBe(403)
  })

  it('returns the user profile without secrets', async () => {
    const { status, body } = await call('get', '/me', { user: student })
    expect(status).toBe(200)
    expect(body.user).toMatchObject({ id: student.id, role: 'student', hasEducator: true, inviteCode: null })
    expect(body.educatorName).toBe(educator.name)
    expect(JSON.stringify(body)).not.toMatch(/hash|salt|password/i)
  })

  it('updates name, weekly goal and theme, with validation', async () => {
    const ok = await call('patch', '/me', { user: student, body: { name: 'Renamed Student', weeklyGoal: 7, theme: 'dark' } })
    expect(ok.body.user).toMatchObject({ name: 'Renamed Student', weeklyGoal: 7, theme: 'dark' })
    expect((await call('patch', '/me', { user: student, body: { weeklyGoal: 99 } })).status).toBe(400)
  })
})

describe('student flow', () => {
  it('offers new sets, records practice and never offers the set again', async () => {
    const next = await call('get', '/practice/:category/next', { user: student, params: { category: 'part-1' } })
    expect(next.body.sets).toHaveLength(3)
    const setId = next.body.sets[0].id

    const detail = await call('get', '/sets/:id', { user: student, params: { id: setId } })
    expect(detail.body.set.questions[0]).toMatchObject({ question: 'Do you like your hometown?', answer: 'Yes, I do.' })
    expect(detail.body.practisedAt).toBeNull()

    const recorded = await call('post', '/practice', { user: student, body: { setId, confidence: 4, speakingSeconds: 75 } })
    expect(recorded.body.created).toBe(true)

    const after = await call('get', '/practice/:category/next', { user: student, params: { category: 'part-1' } })
    expect(after.body.sets.map((s: { id: string }) => s.id)).not.toContain(setId)
    expect((await call('get', '/sets/:id', { user: student, params: { id: setId } })).body.practisedAt).toBeTruthy()

    const history = await call('get', '/history', { user: student })
    expect(history.body.entries[0]).toMatchObject({ setId, confidence: 4, speakingSeconds: 75 })

    const dashboard = await call('get', '/student/dashboard', { user: student })
    expect(dashboard.body.progress.thisWeek).toBe(1)
    expect(dashboard.body.categories[0]).toMatchObject({ slug: 'part-1', remaining: 2, total: 3 })
  })

  it('a student cannot record practice for someone else', async () => {
    const res = await call('post', '/practice', { user: student, body: { setId: sets[2].id, studentId: otherStudent.id } })
    // The student's own id is always used; the other student's history stays empty.
    expect(res.status).toBe(200)
    expect((await call('get', '/history', { user: otherStudent })).body.totalDocs).toBe(0)
  })

  it('joins an educator and resets the cycle', async () => {
    const newcomer = await createUser(payload, { role: 'student' })
    const code = (await payload.findByID({ collection: 'users', id: otherEducator.id })).inviteCode!
    expect((await call('post', '/join', { user: newcomer, body: { code: 'WRONG1' } })).status).toBe(400)
    expect((await call('post', '/join', { user: newcomer, body: { code } })).body.educatorName).toBe(otherEducator.name)
    expect((await call('post', '/cycle', { user: newcomer })).status).toBe(400) // nothing practised yet
  })

  it('AI feedback is refused while switched off', async () => {
    const res = await call('post', '/feedback', { user: student, body: { setId: sets[0].id, questionIndex: 0, answerText: 'x'.repeat(40) } })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/not switched on/)
  })

  it('AI feedback works with the fake reviewer', async () => {
    process.env.AI_FAKE = 'true'
    try {
      const res = await call('post', '/feedback', {
        user: student,
        body: { setId: sets[0].id, questionIndex: 0, answerText: 'I really like my hometown because the food is great.' },
      })
      expect(res.status).toBe(200)
      expect(res.body.item.result.estimatedBand).toBeGreaterThan(0)
      expect(res.body.usedToday).toBe(1)
      expect((await call('get', '/feedback', { user: student })).body.items).toHaveLength(1)
    } finally {
      delete process.env.AI_FAKE
    }
  })
})

describe('educator flow', () => {
  it('lists only their own students', async () => {
    const { body } = await call('get', '/educator/students', { user: educator })
    expect(body.students.map((s: { id: string }) => s.id)).toEqual([student.id])
    expect(body.inviteCode).toMatch(/^[A-Z2-9]{6}$/)
  })

  it("returns 404 for another educator's student everywhere", async () => {
    const params = { id: otherStudent.id }
    expect((await call('get', '/educator/students/:id', { user: educator, params })).status).toBe(404)
    expect((await call('get', '/educator/students/:id/todo', { user: educator, params })).status).toBe(404)
    expect((await call('get', '/history', { user: educator, query: { student: otherStudent.id } })).status).toBe(404)
    expect((await call('get', '/feedback', { user: educator, query: { student: otherStudent.id } })).status).toBe(404)
    expect((await call('get', '/sets/:id', { user: educator, params: { id: sets[0].id }, query: { student: otherStudent.id } })).status).toBe(404)
  })

  it('assigns, notes, marks covered and sees it all on the student page', async () => {
    const todo = await call('get', '/educator/students/:id/todo', { user: educator, params: { id: student.id } })
    const setId = todo.body.sets[0].id
    expect((await call('post', '/educator/assignments', { user: educator, body: { studentId: student.id, setIds: [setId], note: 'Try this' } })).body).toEqual({ created: 1, skipped: 0 })
    const note = await call('post', '/educator/notes', { user: educator, body: { studentId: student.id, body: 'Good progress' } })
    expect(note.body.note.body).toBe('Good progress')

    const covered = await call('post', '/practice', { user: educator, body: { studentId: student.id, setId } })
    expect(covered.body.created).toBe(true)

    const detail = await call('get', '/educator/students/:id', { user: educator, params: { id: student.id } })
    expect(detail.body.assignments[0]).toMatchObject({ setId, done: true, note: 'Try this' })
    expect(detail.body.notes[0].body).toBe('Good progress')

    // Another educator can neither see nor remove them.
    const assignmentId = detail.body.assignments[0].id
    expect((await call('delete', '/educator/assignments/:id', { user: otherEducator, params: { id: assignmentId } })).status).toBe(400)
    expect((await call('delete', '/educator/notes/:id', { user: otherEducator, params: { id: note.body.note.id } })).status).toBe(400)
    expect((await call('delete', '/educator/assignments/:id', { user: educator, params: { id: assignmentId } })).body).toEqual({ ok: true })
  })

  it('regenerates the invite code', async () => {
    const before = (await call('get', '/educator/students', { user: educator })).body.inviteCode
    const after = (await call('post', '/educator/invite-code', { user: educator })).body.inviteCode
    expect(after).not.toBe(before)
  })
})
