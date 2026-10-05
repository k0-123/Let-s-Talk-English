import { APIError, type AccessResult, type CollectionConfig } from 'payload'

import { adminOnly, isAdmin, isApprovedEducator, isStudent, relationId } from '@/access'

export const PracticeLogs: CollectionConfig = {
  slug: 'practice-logs',
  labels: { singular: 'Practice log', plural: 'Practice logs' },
  admin: {
    defaultColumns: ['student', 'questionSet', 'practisedAt', 'markedBy', 'cycle'],
    group: 'People',
    description: 'One row each time a student practises a set (or an educator marks it as covered).',
  },
  defaultSort: '-practisedAt',
  // The core rule: a set is recorded at most once per student per cycle.
  indexes: [{ fields: ['student', 'questionSet', 'cycle'], unique: true }],
  access: {
    read: ({ req: { user } }): AccessResult => {
      if (!user) return false
      if (isAdmin(user)) return true
      if (isStudent(user)) return { student: { equals: user.id } }
      if (isApprovedEducator(user)) return { 'student.educator': { equals: user.id } }
      return false
    },
    create: async ({ req, data }) => {
      const { user } = req
      if (!user) return false
      if (isAdmin(user)) return true

      const studentId = relationId(data?.student)
      if (isStudent(user)) return !studentId || studentId === String(user.id)

      if (isApprovedEducator(user)) {
        if (!studentId) return false
        const student = await req.payload
          .findByID({ collection: 'users', id: studentId, depth: 0, req, disableErrors: true })
          .catch(() => null)
        return (
          student?.role === 'student' && relationId(student.educator) === String(user.id)
        )
      }
      return false
    },
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !data) return data
        const { user } = req

        if (isStudent(user)) {
          data.student = user!.id
          data.markedBy = 'student'
        } else if (isApprovedEducator(user)) {
          data.markedBy = 'educator'
        } else if (isAdmin(user)) {
          data.markedBy = data.markedBy ?? 'admin'
        }

        const studentId = relationId(data.student)
        if (studentId && !(isAdmin(user) && data.cycle)) {
          const student = await req.payload.findByID({
            collection: 'users',
            id: studentId,
            depth: 0,
            req,
          })
          if (student.role !== 'student') {
            throw new APIError('Practice can only be recorded for students.', 400, null, true)
          }
          data.cycle = student.cycle ?? 1
        }

        const setId = relationId(data.questionSet)
        if (setId && !isAdmin(user)) {
          const set = await req.payload
            .findByID({ collection: 'question-sets', id: setId, depth: 0, req, disableErrors: true })
            .catch(() => null)
          if (!set || set.status !== 'published') {
            throw new APIError('That question set is not available.', 404, null, true)
          }
        }

        if (!data.practisedAt || !isAdmin(user)) data.practisedAt = new Date().toISOString()
        return data
      },
    ],
  },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      filterOptions: ({ user }) => (isAdmin(user) ? { role: { equals: 'student' } } : true),
    },
    {
      name: 'questionSet',
      type: 'relationship',
      relationTo: 'question-sets',
      required: true,
      index: true,
    },
    {
      name: 'practisedAt',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'markedBy',
      type: 'select',
      required: true,
      defaultValue: 'student',
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Educator', value: 'educator' },
        { label: 'Admin', value: 'admin' },
      ],
    },
    {
      name: 'confidence',
      type: 'number',
      min: 1,
      max: 5,
      admin: { description: 'How confident the student felt (1–5), if they rated it.' },
    },
    {
      name: 'speakingSeconds',
      type: 'number',
      min: 0,
      max: 3600,
      admin: { description: 'Time on the speaking timer, if used.' },
    },
    {
      name: 'cycle',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: "Filled in automatically from the student's current cycle.",
      },
    },
  ],
}
