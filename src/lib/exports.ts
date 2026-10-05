import type { Payload } from 'payload'

import { isAdmin, relationId } from '@/access'
import type { User } from '@/payload-types'

import { toCsv } from './csv'
import { listStudentSummaries } from './educator'

/** CSV exports. Every query runs with the caller's access rules. */

const iso = (value: string | null | undefined) => (value ? new Date(value).toISOString().slice(0, 10) : '')

export const studentSummaryCsv = async (payload: Payload, educator: User): Promise<string> => {
  const students = await listStudentSummaries(payload, educator)
  return toCsv(
    ['Name', 'Email', 'Status', 'Cycle', 'Sets this cycle', 'Sets all time', 'Last active', 'Joined', 'Sets per week (last 8, oldest first)'],
    students.map((s) => [s.name, s.email, s.status, s.cycle, s.setsThisCycle, s.setsAllTime, iso(s.lastActive), iso(s.joinedAt), s.weekly.join(' ')]),
  )
}

export const practiceLogCsv = async (payload: Payload, actor: User, options: { studentId?: string } = {}): Promise<string> => {
  const logs = await payload.find({
    collection: 'practice-logs',
    where: options.studentId ? { student: { equals: options.studentId } } : {},
    sort: '-practisedAt',
    pagination: false,
    depth: 2,
    populate: {
      users: { name: true, email: true },
      'question-sets': { topic: true, code: true, category: true },
      categories: { name: true },
    },
    overrideAccess: false,
    user: actor,
  })
  return toCsv(
    ['Date', 'Student', 'Email', 'Topic', 'Code', 'Category', 'Marked by', 'Cycle', 'Confidence', 'Speaking seconds'],
    logs.docs.map((log) => {
      const student = typeof log.student === 'object' ? log.student : null
      const set = typeof log.questionSet === 'object' ? log.questionSet : null
      const category = set && typeof set.category === 'object' ? set.category : null
      return [
        iso(log.practisedAt),
        student?.name ?? relationId(log.student),
        student?.email ?? '',
        set?.topic ?? '(set removed)',
        set?.code ?? '',
        category?.name ?? '',
        log.markedBy,
        log.cycle,
        log.confidence ?? '',
        log.speakingSeconds ?? '',
      ]
    }),
  )
}

export const csvResponse = (csv: string, filename: string): Response =>
  new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })

export const canExportAll = (user: User | null): boolean => isAdmin(user)
