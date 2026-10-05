import type { Payload } from 'payload'

import { relationId } from '@/access'
import type { User } from '@/payload-types'

import { addDays, dayKey, startOfWeek } from './dates'

/** Pure progress maths, plus one loader that gathers everything a dashboard needs. */

export type Streak = { current: number; best: number; practisedToday: boolean }

/**
 * Consecutive practice days. The current streak survives until the end of
 * today: practising yesterday but not yet today still counts.
 */
export const getStreak = (days: Iterable<string>, today: string): Streak => {
  const set = new Set(days)
  const practisedToday = set.has(today)
  let current = 0
  let cursor = practisedToday ? today : addDays(today, -1)
  while (set.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }

  let best = 0
  for (const day of set) {
    if (set.has(addDays(day, -1))) continue // not the start of a run
    let length = 0
    let d = day
    while (set.has(d)) {
      length++
      d = addDays(d, 1)
    }
    best = Math.max(best, length)
  }
  return { current, best: Math.max(best, current), practisedToday }
}

export type DayCount = { day: string; count: number }

/** Counts per day for the last `weeks` full weeks (Monday first), ending with the current week. */
export const getActivityByDay = (days: string[], today: string, weeks: number): DayCount[] => {
  const counts = new Map<string, number>()
  for (const day of days) counts.set(day, (counts.get(day) ?? 0) + 1)
  const first = addDays(startOfWeek(today), -7 * (weeks - 1))
  const result: DayCount[] = []
  for (let i = 0; i < weeks * 7; i++) {
    const day = addDays(first, i)
    result.push({ day, count: counts.get(day) ?? 0 })
  }
  return result
}

/** Counts per week for the last `weeks` weeks, oldest first (for sparklines). */
export const getWeeklyCounts = (days: string[], today: string, weeks: number): number[] => {
  const thisWeek = startOfWeek(today)
  const counts = new Array<number>(weeks).fill(0)
  for (const day of days) {
    const diffWeeks = Math.round(
      (Date.parse(`${thisWeek}T00:00:00Z`) - Date.parse(`${startOfWeek(day)}T00:00:00Z`)) / (7 * 86400000),
    )
    if (diffWeeks >= 0 && diffWeeks < weeks) counts[weeks - 1 - diffWeeks]++
  }
  return counts
}

export type ActivityStatus = 'active' | 'slipping' | 'inactive' | 'new'

/** Active: practised in the last 7 days. Slipping: 8–14 days. Inactive: longer. New: never practised. */
export const getActivityStatus = (lastDay: string | null, today: string): ActivityStatus => {
  if (!lastDay) return 'new'
  const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastDay}T00:00:00Z`)) / 86400000)
  if (days <= 7) return 'active'
  if (days <= 14) return 'slipping'
  return 'inactive'
}

export type StudentProgress = {
  streak: Streak
  activity: DayCount[]
  thisWeek: number
  weeklyGoal: number
  totalAllTime: number
  totalThisCycle: number
  averageConfidence: number | null
  recent: { setId: string | null; practisedAt: string }[]
}

/** Everything the student dashboard (and the educator's student page) shows about progress. */
export const getStudentProgress = async (
  payload: Payload,
  actor: User,
  student: Pick<User, 'id' | 'cycle' | 'weeklyGoal'>,
  options: { weeks?: number; now?: Date } = {},
): Promise<StudentProgress> => {
  const { weeks = 16, now = new Date() } = options
  const logs = await payload.find({
    collection: 'practice-logs',
    where: { student: { equals: student.id } },
    sort: '-practisedAt',
    pagination: false,
    depth: 0,
    select: { practisedAt: true, cycle: true, confidence: true, questionSet: true },
    overrideAccess: false,
    user: actor,
  })

  const today = dayKey(now)
  const days = logs.docs.map((log) => dayKey(log.practisedAt))
  const weekStart = startOfWeek(today)
  const ratings = logs.docs.map((log) => log.confidence).filter((c): c is number => typeof c === 'number')

  return {
    streak: getStreak(days, today),
    activity: getActivityByDay(days, today, weeks),
    thisWeek: days.filter((d) => d >= weekStart && d <= today).length,
    weeklyGoal: student.weeklyGoal ?? 5,
    totalAllTime: logs.docs.length,
    totalThisCycle: logs.docs.filter((log) => log.cycle === (student.cycle ?? 1)).length,
    averageConfidence: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    recent: logs.docs.slice(0, 5).map((log) => ({ setId: relationId(log.questionSet), practisedAt: log.practisedAt })),
  }
}
