import type { Payload } from 'payload'

import { isApprovedEducator, isStudent, relationId } from '@/access'
import type { User } from '@/payload-types'

import { generateUniqueInviteCode, normaliseInviteCode } from './invite-code'
import { PracticeError } from './practice'

/**
 * Educator and student-linking logic. Reads use the caller's access rules
 * (`overrideAccess: false`). The two writes a role cannot make itself (linking
 * a student, regenerating an invite code) check the role here first.
 */

export type StudentSummary = {
  id: string
  name: string
  email: string
  cycle: number
  /** Sets practised or covered in the student's current cycle. */
  setsThisCycle: number
  /** Sets practised or covered across all cycles. */
  setsAllTime: number
  /** Date of the most recent practice log, if any. */
  lastActive: string | null
  joinedAt: string
}

const requireEducator = (actor: User): void => {
  if (!isApprovedEducator(actor)) throw new PracticeError('Only approved educators can do this.')
}

export const listStudentSummaries = async (
  payload: Payload,
  educator: User,
): Promise<StudentSummary[]> => {
  requireEducator(educator)

  const students = await payload.find({
    collection: 'users',
    where: { and: [{ educator: { equals: educator.id } }, { role: { equals: 'student' } }] },
    sort: 'name',
    pagination: false,
    depth: 0,
    select: { name: true, email: true, cycle: true, createdAt: true },
    overrideAccess: false,
    user: educator,
  })
  if (students.docs.length === 0) return []

  const logs = await payload.find({
    collection: 'practice-logs',
    where: { student: { in: students.docs.map((s) => s.id) } },
    pagination: false,
    depth: 0,
    select: { student: true, cycle: true, practisedAt: true },
    overrideAccess: false,
    user: educator,
  })

  const summaries = new Map<string, StudentSummary>(
    students.docs.map((s) => [
      s.id,
      {
        id: s.id,
        name: s.name,
        email: s.email,
        cycle: s.cycle ?? 1,
        setsThisCycle: 0,
        setsAllTime: 0,
        lastActive: null,
        joinedAt: s.createdAt,
      },
    ]),
  )

  for (const log of logs.docs) {
    const summary = summaries.get(relationId(log.student) ?? '')
    if (!summary) continue
    summary.setsAllTime += 1
    if (log.cycle === summary.cycle) summary.setsThisCycle += 1
    if (!summary.lastActive || log.practisedAt > summary.lastActive) summary.lastActive = log.practisedAt
  }

  return [...summaries.values()]
}

/** Returns the student only if they belong to this educator. */
export const getOwnStudent = async (
  payload: Payload,
  educator: User,
  studentId: string,
): Promise<User | null> => {
  requireEducator(educator)
  try {
    const student = await payload.findByID({
      collection: 'users',
      id: studentId,
      depth: 0,
      overrideAccess: false,
      user: educator,
    })
    if (student.role !== 'student' || relationId(student.educator) !== String(educator.id)) return null
    return student
  } catch {
    return null
  }
}

export const regenerateInviteCode = async (payload: Payload, educator: User): Promise<string> => {
  requireEducator(educator)
  const inviteCode = await generateUniqueInviteCode(payload)
  await payload.update({
    collection: 'users',
    id: educator.id,
    data: { inviteCode },
    overrideAccess: true,
  })
  return inviteCode
}

/** Links a student to the approved educator who owns the invite code. */
export const joinEducatorWithCode = async (
  payload: Payload,
  student: User,
  rawCode: string,
): Promise<{ educatorName: string }> => {
  if (!isStudent(student)) throw new PracticeError('Only students can join an educator.')
  const code = normaliseInviteCode(rawCode)
  if (!code) throw new PracticeError('Please enter an invite code.')

  const result = await payload.find({
    collection: 'users',
    where: {
      and: [
        { inviteCode: { equals: code } },
        { role: { equals: 'educator' } },
        { approved: { equals: true } },
      ],
    },
    limit: 1,
    depth: 0,
    select: { name: true },
    overrideAccess: true,
  })
  const educator = result.docs[0]
  if (!educator) throw new PracticeError('That invite code was not recognised. Check it with your educator.')

  await payload.update({
    collection: 'users',
    id: student.id,
    data: { educator: educator.id },
    overrideAccess: true,
  })
  return { educatorName: educator.name }
}

/** The name of a student's educator. Students cannot read other users, so this is looked up server-side. */
export const getEducatorName = async (payload: Payload, student: User): Promise<string | null> => {
  const educatorId = relationId(student.educator)
  if (!educatorId) return null
  try {
    const educator = await payload.findByID({
      collection: 'users',
      id: educatorId,
      depth: 0,
      select: { name: true },
      overrideAccess: true,
    })
    return educator.name
  } catch {
    return null
  }
}
