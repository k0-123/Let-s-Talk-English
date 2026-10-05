import { headersWithCors, type Endpoint, type PayloadRequest } from 'payload'

import { isApprovedEducator, relationId } from '@/access'
import {
  dailyLimit,
  feedbackUsedToday,
  getAnswerFeedback,
  isAiFeedbackEnabled,
  listFeedback,
} from '@/lib/ai-feedback'
import { assignSets, listAssignments, removeAssignment } from '@/lib/assignments'
import { dayKey } from '@/lib/dates'
import {
  getEducatorName,
  getOwnStudent,
  joinEducatorWithCode,
  listStudentSummaries,
  regenerateInviteCode,
} from '@/lib/educator'
import { addNote, deleteNote, listNotes } from '@/lib/notes'
import {
  PracticeError,
  countUnpractisedByCategory,
  findCurrentLog,
  findUnpractisedSets,
  getCategoryBySlug,
  getHistory,
  getNextSetsForStudent,
  getQuestionSet,
  listCategories,
  recordPractice,
  startNewCycle,
} from '@/lib/practice'
import { getStudentProgress } from '@/lib/progress'
import { parseTheme } from '@/lib/theme'
import type { User } from '@/payload-types'

/**
 * The mobile app's API, served under /api/app/*. Every endpoint:
 *   1. requires a logged-in user (the app sends `Authorization: JWT <token>`),
 *   2. checks the role,
 *   3. calls the same functions as the website, with that user's access rules.
 * Nothing here decides access on its own.
 */

type Role = User['role']
type Json = Record<string, unknown> | unknown[]

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

const json = (req: PayloadRequest, body: Json, status = 200) =>
  Response.json(body, { status, headers: headersWithCors({ headers: new Headers(), req }) })

const bodyOf = async (req: PayloadRequest): Promise<Record<string, unknown>> => {
  if (req.data) return req.data as Record<string, unknown>
  try {
    return ((await req.json?.()) ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}

const str = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value))
const num = (value: unknown): number | null => {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}
const param = (req: PayloadRequest, name: string) => str(req.routeParams?.[name])
const query = (req: PayloadRequest, name: string) => req.searchParams?.get(name) ?? ''

const route = (
  method: Endpoint['method'],
  path: string,
  roles: Role[],
  handler: (req: PayloadRequest, user: User) => Promise<Json>,
): Endpoint => ({
  method,
  path: `/app${path}`,
  handler: async (req) => {
    const user = req.user as User | null
    if (!user) return json(req, { error: 'Please log in.' }, 401)
    if (!roles.includes(user.role)) return json(req, { error: 'This is not available for your account.' }, 403)
    if (user.role === 'educator' && !isApprovedEducator(user)) {
      return json(req, { error: 'Your educator account is waiting for approval.' }, 403)
    }
    try {
      return json(req, await handler(req, user))
    } catch (error) {
      if (error instanceof HttpError) return json(req, { error: error.message }, error.status)
      if (error instanceof PracticeError) return json(req, { error: error.message }, 400)
      req.payload.logger.error({ err: error, msg: `App API ${method.toUpperCase()} ${path} failed` })
      return json(req, { error: 'Something went wrong. Please try again.' }, 500)
    }
  },
})

const publicUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  approved: user.approved ?? false,
  cycle: user.cycle ?? 1,
  weeklyGoal: user.weeklyGoal ?? 5,
  theme: parseTheme(user.theme),
  inviteCode: user.role === 'educator' ? (user.inviteCode ?? null) : null,
  hasEducator: Boolean(relationId(user.educator)),
})

const ownStudentOr404 = async (req: PayloadRequest, educator: User, id: string) => {
  const student = await getOwnStudent(req.payload, educator, id)
  if (!student) throw new HttpError(404, 'Student not found.')
  return student
}

export const appEndpoints: Endpoint[] = [
  // ---------------------------------------------------------------- me
  route('get', '/me', ['student', 'educator'], async (req, user) => ({
    user: publicUser(user),
    educatorName: user.role === 'student' ? await getEducatorName(req.payload, user) : null,
    ai: {
      enabled: user.role === 'student' && isAiFeedbackEnabled(),
      limit: dailyLimit(),
      usedToday: user.role === 'student' && isAiFeedbackEnabled() ? await feedbackUsedToday(req.payload, user.id) : 0,
    },
  })),

  route('patch', '/me', ['student', 'educator'], async (req, user) => {
    const body = await bodyOf(req)
    const data: Partial<User> = {}
    if (body.name !== undefined) {
      const name = str(body.name).trim()
      if (name.length < 2 || name.length > 80) throw new HttpError(400, 'Enter a name between 2 and 80 characters.')
      data.name = name
    }
    if (body.weeklyGoal !== undefined && user.role === 'student') {
      const goal = num(body.weeklyGoal)
      if (!goal || goal < 1 || goal > 50) throw new HttpError(400, 'The weekly goal must be between 1 and 50.')
      data.weeklyGoal = Math.round(goal)
    }
    if (body.theme !== undefined) data.theme = parseTheme(body.theme)
    const updated = await req.payload.update({ collection: 'users', id: user.id, data, overrideAccess: false, user })
    return { user: publicUser(updated) }
  }),

  // ---------------------------------------------------------------- student
  route('get', '/student/dashboard', ['student'], async (req, user) => {
    const categories = await listCategories(req.payload, user)
    const [progress, counts, assignments, recent] = await Promise.all([
      getStudentProgress(req.payload, user, user),
      countUnpractisedByCategory(req.payload, user, user, categories),
      listAssignments(req.payload, user, { today: dayKey(new Date()) }),
      getHistory(req.payload, user, { studentId: user.id, limit: 5 }),
    ])
    return {
      progress,
      categories: categories
        .filter((c) => counts[c.id]?.total > 0)
        .map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? null, ...counts[c.id] })),
      assignments,
      recent: recent.entries,
    }
  }),

  route('get', '/categories', ['student', 'educator'], async (req, user) => {
    const categories = await listCategories(req.payload, user)
    const counts = user.role === 'student' ? await countUnpractisedByCategory(req.payload, user, user, categories) : null
    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description ?? null,
        ...(counts ? counts[c.id] : {}),
      })),
    }
  }),

  route('get', '/practice/:category/next', ['student'], async (req, user) => {
    const category = await getCategoryBySlug(req.payload, user, param(req, 'category'))
    if (!category) throw new HttpError(404, 'Category not found.')
    const next = await getNextSetsForStudent(req.payload, user, category.id)
    return { category: { id: category.id, name: category.name, slug: category.slug }, ...next }
  }),

  route('get', '/sets/:id', ['student', 'educator'], async (req, user) => {
    const set = await getQuestionSet(req.payload, user, param(req, 'id'))
    if (!set) throw new HttpError(404, 'That question set is not available.')
    let target: User | null = user.role === 'student' ? user : null
    const studentId = query(req, 'student')
    if (user.role === 'educator' && studentId) target = await ownStudentOr404(req, user, studentId)
    const log = target ? await findCurrentLog(req.payload, user, target, set.id) : null
    const category = typeof set.category === 'object' ? set.category : null
    return {
      set: {
        id: set.id,
        topic: set.topic,
        category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
        questions: set.questions.map((q) => ({ question: q.question, answer: q.answer ?? null })),
        vocabulary: (set.vocabulary ?? []).map((v) => ({ term: v.term, meaning: v.meaning ?? null })),
        tips: set.tips ?? null,
        imageUrl: typeof set.image === 'object' && set.image?.url ? set.image.url : null,
      },
      practisedAt: log?.practisedAt ?? null,
      feedback: user.role === 'student' ? await listFeedback(req.payload, user, { studentId: user.id, setId: set.id, limit: 10 }) : [],
    }
  }),

  route('post', '/practice', ['student', 'educator'], async (req, user) => {
    const body = await bodyOf(req)
    const studentId = user.role === 'student' ? user.id : str(body.studentId)
    const { log, created } = await recordPractice(req.payload, user, {
      studentId,
      setId: str(body.setId),
      confidence: num(body.confidence),
      speakingSeconds: num(body.speakingSeconds),
    })
    return { created, practisedAt: log.practisedAt, cycle: log.cycle }
  }),

  route('get', '/history', ['student', 'educator'], async (req, user) => {
    let studentId = user.id
    if (user.role === 'educator') studentId = (await ownStudentOr404(req, user, query(req, 'student'))).id
    const categorySlug = query(req, 'category')
    const category = categorySlug ? await getCategoryBySlug(req.payload, user, categorySlug) : null
    return getHistory(req.payload, user, {
      studentId,
      categoryId: category?.id,
      page: Math.max(1, num(query(req, 'page')) ?? 1),
      limit: 20,
    })
  }),

  route('post', '/join', ['student'], async (req, user) => {
    const body = await bodyOf(req)
    return joinEducatorWithCode(req.payload, user, str(body.code))
  }),

  route('post', '/cycle', ['student'], async (req, user) => ({ cycle: await startNewCycle(req.payload, user) })),

  route('get', '/feedback', ['student', 'educator'], async (req, user) => {
    let studentId = user.id
    if (user.role === 'educator') studentId = (await ownStudentOr404(req, user, query(req, 'student'))).id
    return { items: await listFeedback(req.payload, user, { studentId, setId: query(req, 'setId') || undefined, limit: 50 }) }
  }),

  route('post', '/feedback', ['student'], async (req, user) => {
    const body = await bodyOf(req)
    const row = await getAnswerFeedback(req.payload, user, {
      setId: str(body.setId),
      questionIndex: num(body.questionIndex) ?? -1,
      answerText: str(body.answerText),
    })
    const [item] = await listFeedback(req.payload, user, { studentId: user.id, setId: str(body.setId), limit: 1 })
    return { item: item ?? { id: row.id }, usedToday: await feedbackUsedToday(req.payload, user.id), limit: dailyLimit() }
  }),

  // ---------------------------------------------------------------- educator
  route('get', '/educator/students', ['educator'], async (req, user) => ({
    students: await listStudentSummaries(req.payload, user),
    inviteCode: user.inviteCode ?? null,
  })),

  route('get', '/educator/students/:id', ['educator'], async (req, user) => {
    const student = await ownStudentOr404(req, user, param(req, 'id'))
    const categories = await listCategories(req.payload, user)
    const [progress, counts, assignments, notes] = await Promise.all([
      getStudentProgress(req.payload, user, student),
      countUnpractisedByCategory(req.payload, user, student, categories),
      listAssignments(req.payload, user, { studentId: student.id, today: dayKey(new Date()) }),
      listNotes(req.payload, user, student.id),
    ])
    return {
      student: { id: student.id, name: student.name, email: student.email, cycle: student.cycle ?? 1 },
      progress,
      categories: categories
        .filter((c) => counts[c.id]?.total > 0)
        .map((c) => ({ id: c.id, name: c.name, slug: c.slug, ...counts[c.id] })),
      assignments,
      notes: notes.map((n) => ({ id: n.id, body: n.body, createdAt: n.createdAt })),
    }
  }),

  route('get', '/educator/students/:id/todo', ['educator'], async (req, user) => {
    const student = await ownStudentOr404(req, user, param(req, 'id'))
    const categorySlug = query(req, 'category')
    const category = categorySlug ? await getCategoryBySlug(req.payload, user, categorySlug) : null
    return findUnpractisedSets(req.payload, user, {
      student,
      categoryId: category?.id,
      search: query(req, 'q') || null,
      limit: 15,
      page: Math.max(1, num(query(req, 'page')) ?? 1),
    })
  }),

  route('get', '/educator/assignments', ['educator'], async (req, user) => ({
    assignments: await listAssignments(req.payload, user, { today: dayKey(new Date()) }),
  })),

  route('post', '/educator/assignments', ['educator'], async (req, user) => {
    const body = await bodyOf(req)
    const setIds = Array.isArray(body.setIds) ? body.setIds.map(str) : [str(body.setId)]
    return assignSets(req.payload, user, {
      studentId: str(body.studentId),
      setIds,
      note: str(body.note),
      dueDate: str(body.dueDate) || null,
    })
  }),

  route('delete', '/educator/assignments/:id', ['educator'], async (req, user) => {
    await removeAssignment(req.payload, user, param(req, 'id'))
    return { ok: true }
  }),

  route('post', '/educator/notes', ['educator'], async (req, user) => {
    const body = await bodyOf(req)
    const note = await addNote(req.payload, user, { studentId: str(body.studentId), body: str(body.body) })
    return { note: { id: note.id, body: note.body, createdAt: note.createdAt } }
  }),

  route('delete', '/educator/notes/:id', ['educator'], async (req, user) => {
    await deleteNote(req.payload, user, param(req, 'id'))
    return { ok: true }
  }),

  route('post', '/educator/invite-code', ['educator'], async (req, user) => ({
    inviteCode: await regenerateInviteCode(req.payload, user),
  })),
]
