import { describe, expect, it } from 'vitest'

import { toCsv } from '@/lib/csv'
import { addDays, dayKey, startOfTodayInstant, startOfWeek, weekdayIndex } from '@/lib/dates'
import { getActivityByDay, getActivityStatus, getStreak, getWeeklyCounts } from '@/lib/progress'

describe('dates', () => {
  it('uses the calendar day in the given time zone', () => {
    // 20:00 UTC on 4 Oct is already 5 Oct in India (UTC+5:30).
    expect(dayKey('2026-10-04T20:00:00Z', 'Asia/Kolkata')).toBe('2026-10-05')
    expect(dayKey('2026-10-04T20:00:00Z', 'UTC')).toBe('2026-10-04')
  })

  it('adds days across month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('weeks start on Monday', () => {
    expect(weekdayIndex('2026-10-05')).toBe(0) // Monday
    expect(weekdayIndex('2026-10-11')).toBe(6) // Sunday
    expect(startOfWeek('2026-10-11')).toBe('2026-10-05')
  })

  it('finds midnight in the app time zone', () => {
    const start = startOfTodayInstant(new Date('2026-10-05T10:00:00Z'), 'Asia/Kolkata')
    expect(start.toISOString()).toBe('2026-10-04T18:30:00.000Z')
  })
})

describe('streaks', () => {
  const today = '2026-10-10'

  it('counts consecutive days ending today', () => {
    expect(getStreak(['2026-10-08', '2026-10-09', '2026-10-10'], today)).toEqual({ current: 3, best: 3, practisedToday: true })
  })

  it('keeps yesterday’s streak alive until today ends', () => {
    expect(getStreak(['2026-10-08', '2026-10-09'], today)).toEqual({ current: 2, best: 2, practisedToday: false })
  })

  it('resets after a missed day but remembers the best run', () => {
    const days = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-10-10', '2026-10-10']
    expect(getStreak(days, today)).toEqual({ current: 1, best: 4, practisedToday: true })
    expect(getStreak([], today)).toEqual({ current: 0, best: 0, practisedToday: false })
  })
})

describe('activity', () => {
  it('returns full Monday-first weeks ending this week', () => {
    const activity = getActivityByDay(['2026-10-07', '2026-10-07', '2026-09-30'], '2026-10-08', 2)
    expect(activity).toHaveLength(14)
    expect(activity[0].day).toBe('2026-09-28')
    expect(activity.find((d) => d.day === '2026-10-07')?.count).toBe(2)
    expect(activity.find((d) => d.day === '2026-09-30')?.count).toBe(1)
  })

  it('counts per week, oldest first', () => {
    expect(getWeeklyCounts(['2026-10-07', '2026-10-06', '2026-09-30', '2026-01-01'], '2026-10-08', 3)).toEqual([0, 1, 2])
  })

  it('labels students by how recently they practised', () => {
    expect(getActivityStatus(null, '2026-10-10')).toBe('new')
    expect(getActivityStatus('2026-10-04', '2026-10-10')).toBe('active')
    expect(getActivityStatus('2026-09-28', '2026-10-10')).toBe('slipping')
    expect(getActivityStatus('2026-09-01', '2026-10-10')).toBe('inactive')
  })
})

describe('csv', () => {
  it('quotes and neutralises formulas', () => {
    expect(toCsv(['a', 'b'], [['x,y', '=SUM(A1)'], ['say "hi"', null]])).toBe(
      'a,b\r\n"x,y",\'=SUM(A1)\r\n"say ""hi""",\r\n',
    )
  })
})
