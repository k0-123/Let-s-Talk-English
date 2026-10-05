import type { AccessResult, CollectionConfig } from 'payload'

import { adminOnly, isAdmin, isApprovedEducator, isStudent } from '@/access'

/**
 * Claude's feedback on a student's answer to one question. Rows are written
 * only by `getAnswerFeedback` (src/lib/ai-feedback.ts) after its own checks,
 * so nobody can create one through the API.
 */
export const AiFeedback: CollectionConfig = {
  slug: 'ai-feedback',
  labels: { singular: 'AI feedback', plural: 'AI feedback' },
  admin: {
    defaultColumns: ['student', 'questionSet', 'questionIndex', 'createdAt'],
    group: 'People',
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req: { user } }): AccessResult => {
      if (!user) return false
      if (isAdmin(user)) return true
      if (isStudent(user)) return { student: { equals: user.id } }
      if (isApprovedEducator(user)) return { 'student.educator': { equals: user.id } }
      return false
    },
    create: adminOnly,
    update: () => false,
    delete: adminOnly,
    unlock: adminOnly,
  },
  fields: [
    { name: 'student', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'questionSet', type: 'relationship', relationTo: 'question-sets', required: true, index: true },
    { name: 'questionIndex', type: 'number', required: true, min: 0 },
    { name: 'question', type: 'textarea', required: true },
    { name: 'answerText', type: 'textarea', required: true },
    { name: 'result', type: 'json', required: true },
    { name: 'model', type: 'text' },
    { name: 'inputTokens', type: 'number' },
    { name: 'outputTokens', type: 'number' },
  ],
}
