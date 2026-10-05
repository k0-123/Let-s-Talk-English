const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** "5 Oct 2026" in the phone's time zone. */
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** "Mon 5 Oct" for a calendar day key like "2026-10-05". */
export const formatDayKey = (key: string): string => {
  const d = new Date(`${key}T00:00:00Z`)
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export const monthOfDayKey = (key: string): string => MONTHS[new Date(`${key}T00:00:00Z`).getUTCMonth()]

export const formatClock = (seconds: number): string => {
  const s = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?'

const pad = (n: number) => String(n).padStart(2, '0')

/** Today's calendar day on this phone, as "2026-10-05". */
export const todayKey = (now = new Date()): string => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

/** The calendar day `days` after today, as "2026-10-12". */
export const daysFromToday = (days: number, now = new Date()): string => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days)
  return todayKey(d)
}

/** A due date stored as a date (midnight UTC) shown as its calendar day, never shifted by time zone. */
export const formatDue = (value: string | null | undefined): string => (value ? formatDayKey(value.slice(0, 10)) : '')

/** "2:05" spoken, or null when nothing was timed. */
export const formatSpoken = (seconds: number | null | undefined): string | null =>
  seconds && seconds > 0 ? `${formatClock(seconds)} spoken` : null
