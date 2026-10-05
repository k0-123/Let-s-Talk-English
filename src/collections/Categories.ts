import { APIError, type CollectionConfig } from 'payload'

import { adminOnly, contentReaders } from '@/access'
import { slugify } from '@/lib/slugify'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order'],
    group: 'Content',
  },
  defaultSort: 'order',
  access: {
    read: contentReaders,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        const { totalDocs } = await req.payload.count({
          collection: 'question-sets',
          where: { category: { equals: id } },
          req,
        })
        if (totalDocs > 0) {
          throw new APIError(
            `This category still has ${totalDocs} question set(s). Move or delete them first.`,
            400,
            null,
            true,
          )
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Used in links. Filled in from the name if left empty.',
      },
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) =>
            value ? slugify(String(value)) : siblingData?.name ? slugify(siblingData.name) : value,
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional one-line description shown to students, e.g. "Introduction and interview".',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers are listed first.',
      },
    },
  ],
}
