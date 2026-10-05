import { APIError, type CollectionConfig } from 'payload'

import { adminOnly, canSeeContent, isAdmin } from '@/access'
import {
  MAX_SETS_PER_REQUEST,
  SET_READS_PER_WINDOW,
  SET_READS_WINDOW_MS,
} from '@/lib/constants'
import { rateLimit } from '@/lib/rate-limit'

export const QuestionSets: CollectionConfig = {
  slug: 'question-sets',
  labels: { singular: 'Question set', plural: 'Question sets' },
  admin: {
    useAsTitle: 'topic',
    defaultColumns: ['topic', 'category', 'status', 'code', 'updatedAt'],
    listSearchableFields: ['topic', 'code'],
    group: 'Content',
  },
  defaultSort: 'createdAt',
  access: {
    // Logged-out users and unapproved educators see nothing; everyone else
    // except the admin only sees published sets.
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (canSeeContent(user)) return { status: { equals: 'published' } }
      return false
    },
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeOperation: [
      ({ args, operation, req }) => {
        // Anti-scraping: non-admins get small pages and a per-user request budget.
        // Relationship population (currentDepth set) and trusted server calls
        // (overrideAccess) are not counted.
        if (operation !== 'read' || args.overrideAccess || args.currentDepth || !req.user) {
          return args
        }
        if (isAdmin(req.user)) return args

        const limit = rateLimit(`sets:${req.user.id}`, SET_READS_PER_WINDOW, SET_READS_WINDOW_MS)
        if (!limit.ok) {
          throw new APIError(
            `Too many requests. Please wait ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s) and try again.`,
            429,
            null,
            true,
          )
        }
        if ('limit' in args || 'pagination' in args) {
          if (!args.limit || args.limit > MAX_SETS_PER_REQUEST) args.limit = MAX_SETS_PER_REQUEST
          args.pagination = true
        }
        return args
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Deleting a set also deletes its practice records, assignments and feedback. Unpublishing keeps them.
        for (const collection of ['practice-logs', 'assignments', 'ai-feedback'] as const) {
          await req.payload.delete({ collection, where: { questionSet: { equals: id } }, req })
        }
      },
    ],
  },
  fields: [
    {
      name: 'topic',
      type: 'text',
      required: true,
      maxLength: 200,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'draft',
          index: true,
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
          admin: {
            width: '50%',
            description: 'Students and educators only see published sets.',
          },
        },
      ],
    },
    {
      name: 'questions',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Question', plural: 'Questions' },
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'question',
          type: 'textarea',
          required: true,
        },
        {
          name: 'answer',
          type: 'textarea',
          label: 'Sample answer',
        },
      ],
    },
    {
      name: 'vocabulary',
      type: 'array',
      labels: { singular: 'Word or phrase', plural: 'Vocabulary' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'term', type: 'text', required: true, admin: { width: '40%' } },
            { name: 'meaning', type: 'text', admin: { width: '60%' } },
          ],
        },
      ],
    },
    {
      name: 'tips',
      type: 'textarea',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'code',
      type: 'text',
      unique: true,
      index: true,
      label: 'Reference code',
      admin: {
        position: 'sidebar',
        description:
          'Optional unique code, e.g. "P1-WORK-01". Bulk import uses it to update a set instead of creating a duplicate.',
      },
    },
  ],
}
