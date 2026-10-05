/**
 * Calendar-day helpers. Days are counted in the app's time zone (the `TZ`
 * environment variable), so "today" and streaks match what students see.
 */

export const appTimeZone = (): string =>
  process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const keyFormatters = new Map<string, Intl.DateTimeFormat>()

/** "2026-10-05" for the calendar day `date` falls on in `timeZone`. */
export const dayKey = (date: Date | string, timeZone = appTimeZone()): string => {
  let formatter = keyFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    keyFormatters.set(timeZone, formatter)
  }
  return formatter.format(new Date(date))
}

/** Day keys are plain calendar dates, so arithmetic on them is done in UTC. */
export const addDays = (key: string, days: number): string => {
  const d = new Date(`${key}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** 0 = Monday … 6 = Sunday. */
export const weekdayIndex = (key: string): number => (new Date(`${key}T00:00:00Z`).getUTCDay() + 6) % 7

/** Monday of the week containing `key`. */
export const startOfWeek = (key: string): string => addDays(key, -weekdayIndex(key))

/** Start of today in the app time zone, as an instant (for "created today" queries). */
export const startOfTodayInstant = (now = new Date(), timeZone = appTimeZone()): Date => {
  const today = dayKey(now, timeZone)
  // Walk back from now in 15-minute steps until the day changes: robust for any offset.
  let t = now.getTime() - (now.getTime() % (15 * 60 * 1000))
  while (dayKey(new Date(t - 1), timeZone) === today) t -= 15 * 60 * 1000
  return new Date(t)
}
