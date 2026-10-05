import type { Payload, Where } from 'payload'

import { isApprovedEducator, isStudent, relationId } from '@/access'
import type { Assignment, User } from '@/payload-types'

import { PracticeError } from './practice'

/**
 * Educators assign sets to their students. An assignment is "done" when the
 * student has practised (or the educator covered) the set in the student's
 * current cycle; nothing extra is stored.
 */

export type AssignmentView = {
  id: string
  setId: string | null
  topic: string | null
  categoryId: string | null
  studentId: string | null
  studentName: string | null
  note: string | null
  dueDate: string | null
  createdAt: string
  done: boolean
  overdue: boolean
}

const asQuery = (user: User) => ({ overrideAccess: false, user }) as const

/** Assign one or more sets. Sets already assigned to the student are skipped. */
export const assignSets = async (
  payload: Payload,
  educator: User,
  options: { studentId: string; setIds: string[]; note?: string; dueDate?: string | null },
): Promise<{ created: number; skipped: number }> => {
  if (!isApprovedEducator(educator)) throw new PracticeError('Only approved educators can assign sets.')
  const setIds = [...new Set(options.setIds.filter(Boolean))].slice(0, 20)
  if (setIds.length === 0) throw new PracticeError('Choose at least one set to assign.')

  const existing = await payload.find({
    collection: 'assignments',
    where: { and: [{ student: { equals: options.studentId } }, { questionSet: { in: setIds } }] },
    pagination: false,
    depth: 0,
    select: { questionSet: true },
    ...asQuery(educator),
  })
  const already = new Set(existing.docs.map((a) => relationId(a.questionSet)))

  let created = 0
  for (const setId of setIds) {
    if (already.has(setId)) continue
    try {
      await payload.create({
        collection: 'assignments',
        data: {
          student: options.studentId,
          questionSet: setId,
          note: options.note?.trim() || null,
          dueDate: options.dueDate || null,
        } as Assignment,
        ...asQuery(educator),
      })
      created++
    } catch {
      throw new PracticeError('That student or set is not available.')
    }
  }
  return { created, skipped: setIds.length - created }
}

export const removeAssignment = async (payload: Payload, educator: User, id: string): Promise<void> => {
  if (!isApprovedEducator(educator)) throw new PracticeError('Only approved educators can remove assignments.')
  try {
    await payload.delete({ collection: 'assignments', id, ...asQuery(educator) })
  } catch {
    throw new PracticeError('Assignment not found.')
  }
}

/** Lists assignments the actor may see, with done/overdue worked out per student cycle. */
export const listAssignments = async (
  payload: Payload,
  actor: User,
  options: { studentId?: string; today?: string } = {},
): Promise<AssignmentView[]> => {
  const where: Where = options.studentId ? { student: { equals: options.studentId } } : {}
  const result = await payload.find({
    collection: 'assignments',
    where,
    sort: '-createdAt',
    pagination: false,
    depth: 1,
    populate: { 'question-sets': { topic: true, category: true }, users: { name: true, cycle: true } },
    ...asQuery(actor),
  })
  if (result.docs.length === 0) return []

  // Which (student, set) pairs have a log in the student's current cycle?
  const students = new Map<string, number>()
  for (const a of result.docs) {
    const s = typeof a.student === 'object' ? a.student : null
    const id = relationId(a.student)
    if (id) students.set(id, isStudent(actor) && id === String(actor.id) ? (actor.cycle ?? 1) : (s?.cycle ?? 1))
  }
  const logs = await payload.find({
    collection: 'practice-logs',
    where: {
      and: [
        { student: { in: [...students.keys()] } },
        { questionSet: { in: result.docs.map((a) => relationId(a.questionSet)).filter(Boolean) } },
      ],
    },
    pagination: false,
    depth: 0,
    select: { student: true, questionSet: true, cycle: true },
    ...asQuery(actor),
  })
  const done = new Set(
    logs.docs
      .filter((log) => log.cycle === students.get(relationId(log.student) ?? ''))
      .map((log) => `${relationId(log.student)}:${relationId(log.questionSet)}`),
  )

  const today = options.today ?? new Date().toISOString().slice(0, 10)
  return result.docs.map((a) => {
    const set = typeof a.questionSet === 'object' ? a.questionSet : null
    const student = typeof a.student === 'object' ? a.student : null
    const isDone = done.has(`${relationId(a.student)}:${relationId(a.questionSet)}`)
    const due = a.dueDate ? a.dueDate.slice(0, 10) : null
    return {
      id: a.id,
      setId: relationId(a.questionSet),
      topic: set?.topic ?? null,
      categoryId: set ? relationId(set.category) : null,
      studentId: relationId(a.student),
      studentName: student?.name ?? null,
      note: a.note ?? null,
      dueDate: a.dueDate ?? null,
      createdAt: a.createdAt,
      done: isDone,
      overdue: !isDone && !!due && due < today,
    }
  })
}
