import type { Payload, Where } from 'payload'

import { isApprovedEducator, isStudent, relationId } from '@/access'
import type { Category, PracticeLog, QuestionSet, User } from '@/payload-types'

import { NEW_SETS_BATCH_SIZE } from './constants'

/**
 * Practice domain logic. Every query runs with `overrideAccess: false` and the
 * acting user, so the collection access rules in src/collections decide what
 * each role can read and write. Only the few writes a role is not allowed to
 * make directly (joining an educator, resetting a cycle) use overrideAccess,
 * after checking the role here.
 */

export class PracticeError extends Error {}

type Actor = User

const asQuery = (user: Actor) => ({ overrideAccess: false, user }) as const

/** IDs of the sets a student has practised in the given cycle. */
export const getPractisedSetIds = async (
  payload: Payload,
  actor: Actor,
  studentId: string,
  cycle: number,
): Promise<string[]> => {
  const logs = await payload.find({
    collection: 'practice-logs',
    where: { and: [{ student: { equals: studentId } }, { cycle: { equals: cycle } }] },
    depth: 0,
    pagination: false,
    select: { questionSet: true },
    ...asQuery(actor),
  })
  return logs.docs.map((log) => relationId(log.questionSet)).filter((id): id is string => !!id)
}

export const listCategories = async (payload: Payload, actor: Actor): Promise<Category[]> => {
  const result = await payload.find({
    collection: 'categories',
    sort: 'order',
    pagination: false,
    depth: 0,
    ...asQuery(actor),
  })
  return result.docs
}

export const getCategoryBySlug = async (
  payload: Payload,
  actor: Actor,
  slug: string,
): Promise<Category | null> => {
  const result = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    ...asQuery(actor),
  })
  return result.docs[0] ?? null
}

/** Published sets per category, for the category picker. */
export const countPublishedSetsByCategory = async (
  payload: Payload,
  actor: Actor,
  categories: Category[],
): Promise<Record<string, number>> => {
  const counts: Record<string, number> = {}
  for (const category of categories) {
    const { totalDocs } = await payload.count({
      collection: 'question-sets',
      where: { and: [{ category: { equals: category.id } }, { status: { equals: 'published' } }] },
      ...asQuery(actor),
    })
    counts[category.id] = totalDocs
  }
  return counts
}

export type SetSummary = Pick<QuestionSet, 'id' | 'topic'> & { questionCount: number }

const toSummary = (set: Pick<QuestionSet, 'id' | 'topic' | 'questions'>): SetSummary => ({
  id: set.id,
  topic: set.topic,
  questionCount: set.questions?.length ?? 0,
})

export type UnpractisedSetsResult = {
  sets: SetSummary[]
  /** Unpractised published sets remaining (in the category, if one was given). */
  remaining: number
  page: number
  totalPages: number
}

/**
 * The core non-repeat rule: published sets the student has no practice log for
 * in their current cycle.
 */
export const findUnpractisedSets = async (
  payload: Payload,
  actor: Actor,
  options: {
    student: Pick<User, 'id' | 'cycle'>
    categoryId?: string | null
    limit?: number
    page?: number
  },
): Promise<UnpractisedSetsResult> => {
  const { student, categoryId, limit = NEW_SETS_BATCH_SIZE, page = 1 } = options
  const practised = await getPractisedSetIds(payload, actor, student.id, student.cycle ?? 1)

  const conditions: Where[] = [{ status: { equals: 'published' } }]
  if (categoryId) conditions.push({ category: { equals: categoryId } })
  if (practised.length) conditions.push({ id: { not_in: practised } })

  const result = await payload.find({
    collection: 'question-sets',
    where: { and: conditions },
    sort: 'createdAt',
    limit,
    page,
    depth: 0,
    select: { topic: true, questions: { question: true } },
    ...asQuery(actor),
  })

  return {
    sets: result.docs.map(toSummary),
    remaining: result.totalDocs,
    page: result.page ?? 1,
    totalPages: result.totalPages,
  }
}

/** The 3–5 new sets a student is offered in a category. */
export const getNextSetsForStudent = (
  payload: Payload,
  student: Actor,
  categoryId: string,
): Promise<UnpractisedSetsResult> => {
  if (!isStudent(student)) throw new PracticeError('Only students can get new sets.')
  return findUnpractisedSets(payload, student, { student, categoryId })
}

export const getQuestionSet = async (
  payload: Payload,
  actor: Actor,
  id: string,
): Promise<QuestionSet | null> => {
  try {
    return await payload.findByID({
      collection: 'question-sets',
      id,
      depth: 1,
      ...asQuery(actor),
    })
  } catch {
    return null
  }
}

/** The student's log for a set in their current cycle, if any. */
export const findCurrentLog = async (
  payload: Payload,
  actor: Actor,
  student: Pick<User, 'id' | 'cycle'>,
  setId: string,
): Promise<PracticeLog | null> => {
  const result = await payload.find({
    collection: 'practice-logs',
    where: {
      and: [
        { student: { equals: student.id } },
        { questionSet: { equals: setId } },
        { cycle: { equals: student.cycle ?? 1 } },
      ],
    },
    limit: 1,
    depth: 0,
    ...asQuery(actor),
  })
  return result.docs[0] ?? null
}

/**
 * Records that a set was practised (by the student) or covered (by their
 * educator). Idempotent: recording the same set twice in a cycle returns the
 * existing log.
 */
export const recordPractice = async (
  payload: Payload,
  actor: Actor,
  options: { studentId: string; setId: string },
): Promise<{ log: PracticeLog; created: boolean }> => {
  const { studentId, setId } = options

  let student: User
  if (isStudent(actor)) {
    if (String(actor.id) !== studentId) throw new PracticeError('You can only record your own practice.')
    student = actor
  } else if (isApprovedEducator(actor)) {
    try {
      student = await payload.findByID({ collection: 'users', id: studentId, depth: 0, ...asQuery(actor) })
    } catch {
      throw new PracticeError('Student not found.')
    }
    if (relationId(student.educator) !== String(actor.id)) {
      throw new PracticeError('Student not found.')
    }
  } else {
    throw new PracticeError('You are not allowed to record practice.')
  }

  const existing = await findCurrentLog(payload, actor, student, setId)
  if (existing) return { log: existing, created: false }

  try {
    const log = await payload.create({
      collection: 'practice-logs',
      data: { student: studentId, questionSet: setId } as PracticeLog,
      ...asQuery(actor),
    })
    return { log, created: true }
  } catch (error) {
    // A parallel request may have created the same log (unique index).
    const raced = await findCurrentLog(payload, actor, student, setId)
    if (raced) return { log: raced, created: false }
    throw error
  }
}

export type HistoryEntry = {
  id: string
  setId: string | null
  topic: string | null
  categoryId: string | null
  practisedAt: string
  markedBy: PracticeLog['markedBy']
  cycle: number
}

export type HistoryPage = {
  entries: HistoryEntry[]
  totalDocs: number
  page: number
  totalPages: number
}

export const getHistory = async (
  payload: Payload,
  actor: Actor,
  options: { studentId: string; categoryId?: string | null; cycle?: number | null; page?: number; limit?: number },
): Promise<HistoryPage> => {
  const { studentId, categoryId, cycle, page = 1, limit = 25 } = options
  const conditions: Where[] = [{ student: { equals: studentId } }]
  if (categoryId) conditions.push({ 'questionSet.category': { equals: categoryId } })
  if (cycle) conditions.push({ cycle: { equals: cycle } })

  const result = await payload.find({
    collection: 'practice-logs',
    where: { and: conditions },
    sort: '-practisedAt',
    depth: 1,
    page,
    limit,
    populate: { 'question-sets': { topic: true, category: true } },
    ...asQuery(actor),
  })

  return {
    entries: result.docs.map((log) => {
      const set = typeof log.questionSet === 'object' ? log.questionSet : null
      return {
        id: log.id,
        setId: relationId(log.questionSet),
        topic: set?.topic ?? null,
        categoryId: set ? relationId(set.category) : null,
        practisedAt: log.practisedAt,
        markedBy: log.markedBy,
        cycle: log.cycle,
      }
    }),
    totalDocs: result.totalDocs,
    page: result.page ?? 1,
    totalPages: result.totalPages,
  }
}

/** Starts a new preparation cycle: every set becomes "new" again. History is kept. */
export const startNewCycle = async (payload: Payload, student: Actor): Promise<number> => {
  if (!isStudent(student)) throw new PracticeError('Only students can reset their practice.')
  const current = student.cycle ?? 1
  const { totalDocs } = await payload.count({
    collection: 'practice-logs',
    where: { and: [{ student: { equals: student.id } }, { cycle: { equals: current } }] },
    ...asQuery(student),
  })
  if (totalDocs === 0) throw new PracticeError('You have not practised any sets in this cycle yet.')

  // `cycle` is admin-only at field level; this is the one sanctioned way for a student to change it.
  await payload.update({
    collection: 'users',
    id: student.id,
    data: { cycle: current + 1 },
    overrideAccess: true,
  })
  return current + 1
}
