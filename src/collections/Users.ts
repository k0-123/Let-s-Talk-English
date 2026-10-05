import { APIError, ValidationError, type CollectionConfig, type Where } from 'payload'

import { adminOnly, adminOnlyField, isAdmin, isApprovedEducator, isEducator, relationId } from '@/access'
import {
  educatorApprovedHTML,
  educatorApprovedSubject,
  newEducatorHTML,
  newEducatorSubject,
  resetPasswordHTML,
  resetPasswordSubject,
  verifyEmailHTML,
  verifyEmailSubject,
} from '@/email/templates'
import { generateUniqueInviteCode } from '@/lib/invite-code'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'approved', 'educator', '_verified'],
    listSearchableFields: ['name', 'email', 'inviteCode'],
    group: 'People',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days; students mostly use phones
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    verify: {
      generateEmailSubject: () => verifyEmailSubject(),
      generateEmailHTML: ({ token, user }) => verifyEmailHTML({ name: user?.name, token }),
    },
    forgotPassword: {
      expiration: 60 * 60 * 1000,
      generateEmailSubject: () => resetPasswordSubject(),
      generateEmailHTML: (args) => resetPasswordHTML({ token: args?.token ?? '' }),
    },
  },
  access: {
    // Only the client (admin) may open the Payload admin panel.
    admin: ({ req: { user } }) => isAdmin(user),
    // Public self-registration. The hooks below stop anyone creating an admin.
    create: () => true,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isAdmin(user)) return true
      if (isEducator(user)) {
        const ownStudents: Where = {
          or: [{ id: { equals: user.id } }, { educator: { equals: user.id } }],
        }
        return ownStudents
      }
      return { id: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isAdmin(user)) return true
      return { id: { equals: user.id } }
    },
    delete: adminOnly,
    unlock: adminOnly,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        if (operation === 'create') {
          // The very first account (created from /admin/create-first-user) is the client's admin account.
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) data.role = 'admin'
        }

        const role = data.role ?? originalDoc?.role
        const inviteCode = data.inviteCode ?? originalDoc?.inviteCode
        if (role === 'educator' && !inviteCode) {
          data.inviteCode = await generateUniqueInviteCode(req.payload, req)
        }
        if (role !== 'student' && (data.educator ?? originalDoc?.educator)) {
          data.educator = null
        }

        const newEducatorId = relationId(data.educator)
        if (newEducatorId && newEducatorId !== relationId(originalDoc?.educator)) {
          const educator = await req.payload
            .findByID({ collection: 'users', id: newEducatorId, depth: 0, req, disableErrors: true })
            .catch(() => null)
          if (educator?.role !== 'educator') {
            throw new ValidationError({
              collection: 'users',
              errors: [{ message: 'Choose a user whose role is Educator.', path: 'educator' }],
            })
          }
        }
        return data
      },
    ],
    afterChange: [
      ({ doc, previousDoc, operation, req }) => {
        if (doc.role !== 'educator') return
        const send = (to: string, subject: string, html: string) =>
          req.payload.sendEmail({ to, subject, html }).catch((error: unknown) =>
            req.payload.logger.error({ err: error, msg: `Could not send email to ${to}` }),
          )

        if (operation === 'create' && !doc.approved) {
          // Tell the admin(s) someone is waiting. Not awaited (and outside the request's
          // transaction): email must never block or fail sign-up.
          void req.payload
            .find({ collection: 'users', where: { role: { equals: 'admin' } }, depth: 0, limit: 10 })
            .then(({ docs }) =>
              Promise.all(
                docs.map((admin) =>
                  send(admin.email, newEducatorSubject(), newEducatorHTML({ name: doc.name, email: doc.email })),
                ),
              ),
            )
        }
        if (operation === 'update' && doc.approved && !previousDoc?.approved) {
          void send(doc.email, educatorApprovedSubject(), educatorApprovedHTML({ name: doc.name }))
        }
      },
    ],
    beforeLogin: [
      ({ user }) => {
        if (user?.role === 'educator' && !isApprovedEducator(user)) {
          throw new APIError(
            'Your educator account is waiting for approval. We will email you once it is approved.',
            403,
            null,
            true,
          )
        }
        return user
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Keep the database consistent: remove the user's practice history and
        // unlink any students who were linked to a deleted educator.
        await req.payload.delete({
          collection: 'practice-logs',
          where: { student: { equals: id } },
          req,
        })
        await req.payload.update({
          collection: 'users',
          where: { educator: { equals: id } },
          data: { educator: null },
          req,
        })
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 80,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'student',
      saveToJWT: true,
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Educator', value: 'educator' },
        { label: 'Admin', value: 'admin' },
      ],
      access: {
        // Public sign-up may choose student or educator; only an admin can create an admin.
        // A disallowed value is dropped and the default (student) is used.
        create: ({ req: { user }, siblingData }) => isAdmin(user) || siblingData?.role !== 'admin',
        update: adminOnlyField,
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      label: 'Approved educator',
      access: {
        create: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        position: 'sidebar',
        description: 'Educators cannot log in or see any content until this is ticked.',
        condition: (data) => data?.role === 'educator',
      },
    },
    {
      name: 'inviteCode',
      type: 'text',
      unique: true,
      index: true,
      access: {
        create: adminOnlyField,
        update: adminOnlyField,
        read: ({ req: { user }, doc }) => isAdmin(user) || (!!user && user.id === doc?.id),
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Students enter this code to join the educator. Generated automatically.',
        condition: (data) => data?.role === 'educator',
      },
    },
    {
      name: 'educator',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      // No filterOptions on purpose: Payload re-validates them with the caller's
      // access, and a student cannot read their educator's account. The
      // beforeChange hook checks the value points at an educator instead.
      access: {
        create: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        position: 'sidebar',
        description: 'The educator this student belongs to (one educator per student).',
        condition: (data) => data?.role === 'student',
      },
    },
    {
      name: 'cycle',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
      label: 'Practice cycle',
      access: {
        create: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        position: 'sidebar',
        description:
          'Starts at 1. Goes up by one each time the student resets their history to start a new preparation cycle.',
        condition: (data) => data?.role === 'student',
      },
    },
  ],
}
