import type { CollectionConfig } from 'payload'

import { adminOnly, contentReaders } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    read: contentReaders,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  upload: {
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt text',
      admin: {
        description: 'Short description of the image for screen readers.',
      },
    },
  ],
}
