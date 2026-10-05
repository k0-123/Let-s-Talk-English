import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs))

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const partsFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })

/**
 * "5 Oct 2026" in the app time zone. Built by hand rather than with
 * Intl month names, because Node and browsers disagree on those ("Sep" vs
 * "Sept"), which breaks hydration of client components.
 */
export const formatDate = (value: string | Date | null | undefined, timeZone = process.env.TZ || 'UTC'): string => {
  if (!value) return '—'
  const [y, m, d] = partsFormatter(timeZone).format(new Date(value)).split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** "Mon 5 Oct" for a calendar day key like "2026-10-05". */
export const formatDayKey = (key: string): string => {
  const date = new Date(`${key}T00:00:00Z`)
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
}

export const plural = (count: number, singular: string, pluralForm = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : pluralForm}`
