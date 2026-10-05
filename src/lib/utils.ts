import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs))

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

/** "5 Oct 2026". Dates are shown in the server's time zone (set TZ in production). */
export const formatDate = (value: string | Date | null | undefined): string =>
  value ? dateFormatter.format(new Date(value)) : '—'

export const plural = (count: number, singular: string, pluralForm = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : pluralForm}`
