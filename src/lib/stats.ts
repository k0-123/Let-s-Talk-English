import type { Payload, Where } from 'payload'

import { isAdmin } from '@/access'
import type { User } from '@/payload-types'

import { addDays, dayKey, startOfTodayInstant, weekdayIndex } from './dates'

/** Usage numbers for the admin overview. Admin only. */
export type UsageStats = {
  pendingEducators: number
  students: number
  educators: number
  signups7: number
  signups30: number
  activeStudents7: number
  practisedThisWeek: number
  practisedAllTime: number
  publishedSets: number
  aiToday: number
  topCategories: { name: string; count: number }[]
}

export const getUsageStats = async (payload: Payload, admin: User, now = new Date()): Promise<UsageStats> => {
  if (!isAdmin(admin)) throw new Error('Admins only')
  const q = { overrideAccess: false, user: admin } as const
  const count = (collection: 'users' | 'practice-logs' | 'question-sets' | 'ai-feedback', where: Where) =>
    payload.count({ collection, where, ...q }).then((r) => r.totalDocs)

  const iso = (days: number) => new Date(now.getTime() - days * 86400000).toISOString()
  const today = dayKey(now)
  // Monday 00:00 in the app time zone (fine for zones without daylight saving, like India's).
  const weekStartInstant = new Date(startOfTodayInstant(now).getTime() - weekdayIndex(today) * 86400000)

  const [pendingEducators, students, educators, signups7, signups30, practisedThisWeek, practisedAllTime, publishedSets, aiToday] =
    await Promise.all([
      count('users', { and: [{ role: { equals: 'educator' } }, { approved: { not_equals: true } }] }),
      count('users', { role: { equals: 'student' } }),
      count('users', { and: [{ role: { equals: 'educator' } }, { approved: { equals: true } }] }),
      count('users', { createdAt: { greater_than_equal: iso(7) } }),
      count('users', { createdAt: { greater_than_equal: iso(30) } }),
      count('practice-logs', { practisedAt: { greater_than_equal: weekStartInstant.toISOString() } }),
      count('practice-logs', {}),
      count('question-sets', { status: { equals: 'published' } }),
      count('ai-feedback', { createdAt: { greater_than_equal: startOfTodayInstant(now).toISOString() } }),
    ])

  const recent = await payload.find({
    collection: 'practice-logs',
    where: { practisedAt: { greater_than_equal: iso(30) } },
    pagination: false,
    depth: 2,
    select: { student: true, practisedAt: true, questionSet: true },
    populate: { 'question-sets': { category: true }, categories: { name: true }, users: { name: true } },
    ...q,
  })
  const weekAgo = addDays(today, -7)
  const active = new Set<string>()
  const byCategory = new Map<string, number>()
  for (const log of recent.docs) {
    if (dayKey(log.practisedAt) > weekAgo) {
      active.add(typeof log.student === 'object' && log.student ? log.student.id : String(log.student))
    }
    const set = typeof log.questionSet === 'object' ? log.questionSet : null
    const name = set && typeof set.category === 'object' && set.category ? set.category.name : null
    if (name) byCategory.set(name, (byCategory.get(name) ?? 0) + 1)
  }

  return {
    pendingEducators,
    students,
    educators,
    signups7,
    signups30,
    activeStudents7: active.size,
    practisedThisWeek,
    practisedAllTime,
    publishedSets,
    aiToday,
    topCategories: [...byCategory.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  }
}
