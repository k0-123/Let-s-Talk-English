import type { AccessResult, CollectionConfig } from 'payload'

import { adminOnly, isAdmin, isApprovedEducator, relationId } from '@/access'
import { isOwnStudent } from '@/access/ownership'

/** Private notes an educator keeps about a student. Students never see them. */
export const StudentNotes: CollectionConfig = {
  slug: 'student-notes',
  labels: { singular: 'Student note', plural: 'Student notes' },
  admin: {
    defaultColumns: ['student', 'educator', 'createdAt'],
    group: 'People',
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req: { user } }): AccessResult => {
      if (isAdmin(user)) return true
      if (isApprovedEducator(user)) return { educator: { equals: user!.id } }
      return false
    },
    create: async ({ req, data }) => {
      if (isAdmin(req.user)) return true
      if (!isApprovedEducator(req.user)) return false
      return isOwnStudent(req, req.user!, relationId(data?.student))
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
      ({ data, operation, req }) => {
        if (!data) return data
        if (operation === 'create' && isApprovedEducator(req.user)) data.educator = req.user!.id
        if (operation === 'update' && !isAdmin(req.user)) {
          delete data.student
          delete data.educator
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'student', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'educator', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'body', type: 'textarea', required: true, maxLength: 2000 },
  ],
}
