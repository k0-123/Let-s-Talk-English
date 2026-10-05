import type { PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

import { relationId } from './index'

/** True when `studentId` is a student currently linked to this educator. */
export const isOwnStudent = async (
  req: PayloadRequest,
  educator: Pick<User, 'id'>,
  studentId: string | null,
): Promise<boolean> => {
  if (!studentId) return false
  const student = await req.payload
    .findByID({ collection: 'users', id: studentId, depth: 0, req, disableErrors: true })
    .catch(() => null)
  return student?.role === 'student' && relationId(student.educator) === String(educator.id)
}

/** True when the question set exists and is published. */
export const isPublishedSet = async (req: PayloadRequest, setId: string | null): Promise<boolean> => {
  if (!setId) return false
  const set = await req.payload
    .findByID({ collection: 'question-sets', id: setId, depth: 0, req, disableErrors: true })
    .catch(() => null)
  return set?.status === 'published'
}
