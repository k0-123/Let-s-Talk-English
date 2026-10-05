import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'
import type { Category, QuestionSet, User } from '@/payload-types'

export const getTestPayload = (): Promise<Payload> => getPayload({ config })

/** Deletes every document, children before parents. */
export const resetDatabase = async (payload: Payload): Promise<void> => {
  for (const collection of ['practice-logs', 'question-sets', 'categories', 'media', 'users'] as const) {
    await payload.db.deleteMany({ collection, where: {} })
  }
}

let counter = 0
const unique = () => `${Date.now().toString(36)}${(counter++).toString(36)}`

export const createUser = async (
  payload: Payload,
  data: Partial<User> & { role: User['role'] },
): Promise<User> =>
  payload.create({
    collection: 'users',
    data: {
      name: `${data.role} ${unique()}`,
      email: `${data.role}-${unique()}@example.com`,
      password: 'Password123!',
      _verified: true,
      ...data,
    } as User,
    disableVerificationEmail: true,
  })

export const createCategory = async (payload: Payload, name: string, order = 0): Promise<Category> =>
  payload.create({ collection: 'categories', data: { name, slug: '', order } as Category })

export const createSet = async (
  payload: Payload,
  category: Category,
  data: Partial<QuestionSet> = {},
): Promise<QuestionSet> =>
  payload.create({
    collection: 'question-sets',
    data: {
      topic: `Topic ${unique()}`,
      category: category.id,
      status: 'published',
      questions: [{ question: 'Do you like your hometown?', answer: 'Yes, I do.' }],
      ...data,
    } as QuestionSet,
  })
