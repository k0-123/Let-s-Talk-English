import { APIError, type AccessResult, type CollectionConfig } from 'payload'

import { adminOnly, isAdmin, isApprovedEducator, isStudent, relationId } from '@/access'
import { isOwnStudent, isPublishedSet } from '@/access/ownership'

/**
 * An educator asks a student to practise a specific set. "Done" is not stored:
 * an assignment is done when the student has a practice log for the set in
 * their current cycle.
 */
export const Assignments: CollectionConfig = {
  slug: 'assignments',
  admin: {
    defaultColumns: ['student', 'questionSet', 'educator', 'dueDate', 'createdAt'],
    group: 'People',
  },
  defaultSort: '-createdAt',
  indexes: [{ fields: ['student', 'questionSet'], unique: true }],
  access: {
    read: ({ req: { user } }): AccessResult => {
      if (!user) return false
      if (isAdmin(user)) return true
      if (isStudent(user)) return { student: { equals: user.id } }
      if (isApprovedEducator(user)) return { educator: { equals: user.id } }
      return false
    },
    create: async ({ req, data }) => {
      const { user } = req
      if (isAdmin(user)) return true
      if (!isApprovedEducator(user)) return false
      return isOwnStudent(req, user!, relationId(data?.student))
    },
    update: ({ req: { user } }): AccessResult => {
      if (isAdmin(user)) return true
      if (isApprovedEducator(user)) return { educator: { equals: user!.id } }
      return false
    },
    delete: ({ req: { user } }): AccessResult => {
      if (isAdmin(user)) return true
      if (isApprovedEducator(user)) return { educator: { equals: user!.id } }
      return false
    },
    unlock: adminOnly,
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (!data) return data
        if (operation === 'create' && isApprovedEducator(req.user)) data.educator = req.user!.id
        if (operation === 'update' && !isAdmin(req.user)) {
          // Educators may change the note and due date only.
          delete data.student
          delete data.questionSet
          delete data.educator
        }
        if (operation === 'create' && !isAdmin(req.user)) {
          if (!(await isPublishedSet(req, relationId(data.questionSet)))) {
            throw new APIError('That question set is not available.', 404, null, true)
          }
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'student', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'questionSet', type: 'relationship', relationTo: 'question-sets', required: true, index: true },
    { name: 'educator', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'note', type: 'textarea', maxLength: 500 },
    { name: 'dueDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
  ],
}
