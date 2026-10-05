import type { Access, FieldAccess } from 'payload'

import type { User } from '@/payload-types'

/**
 * Role checks shared by collection access rules, hooks and app pages.
 * Every rule here runs on the server; the UI never decides what a user may see.
 */

type MaybeUser = Partial<Pick<User, 'role' | 'approved'>> | null | undefined

export const isAdmin = (user: MaybeUser): boolean => user?.role === 'admin'

export const isStudent = (user: MaybeUser): boolean => user?.role === 'student'

export const isEducator = (user: MaybeUser): boolean => user?.role === 'educator'

/** Educators only see content once the admin has approved them. */
export const isApprovedEducator = (user: MaybeUser): boolean =>
  user?.role === 'educator' && user.approved === true

/** Users allowed to read published question sets and categories. */
export const canSeeContent = (user: MaybeUser): boolean =>
  isAdmin(user) || isStudent(user) || isApprovedEducator(user)

export const adminOnly: Access = ({ req: { user } }) => isAdmin(user)

export const adminOnlyField: FieldAccess = ({ req: { user } }) => isAdmin(user)

export const contentReaders: Access = ({ req: { user } }) => canSeeContent(user)

/** Returns the id of a relationship value whether it is populated or not. */
export const relationId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    return id === null || id === undefined ? null : String(id)
  }
  return null
}
