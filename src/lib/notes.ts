import type { Payload } from 'payload'

import { isApprovedEducator } from '@/access'
import type { StudentNote, User } from '@/payload-types'

import { PracticeError } from './practice'

/** Private educator notes about a student. Access rules keep them visible to their author only. */

export const listNotes = async (payload: Payload, educator: User, studentId: string): Promise<StudentNote[]> => {
  const result = await payload.find({
    collection: 'student-notes',
    where: { student: { equals: studentId } },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
    overrideAccess: false,
    user: educator,
  })
  return result.docs
}

export const addNote = async (
  payload: Payload,
  educator: User,
  options: { studentId: string; body: string },
): Promise<StudentNote> => {
  if (!isApprovedEducator(educator)) throw new PracticeError('Only approved educators can add notes.')
  const body = options.body.trim()
  if (!body) throw new PracticeError('Write something first.')
  if (body.length > 2000) throw new PracticeError('Notes can be up to 2,000 characters.')
  try {
    return await payload.create({
      collection: 'student-notes',
      data: { student: options.studentId, body } as StudentNote,
      overrideAccess: false,
      user: educator,
    })
  } catch {
    throw new PracticeError('Student not found.')
  }
}

export const deleteNote = async (payload: Payload, educator: User, id: string): Promise<void> => {
  try {
    await payload.delete({ collection: 'student-notes', id, overrideAccess: false, user: educator })
  } catch {
    throw new PracticeError('Note not found.')
  }
}
