'use client'

import { ArrowDownUp, ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Sparkline } from '@/components/charts/sparkline'
import { StatusBadge } from '@/components/status-badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import type { StudentSummary } from '@/lib/educator'

type Sort = 'name' | 'active' | 'sets' | 'attention'

const attentionRank = { inactive: 0, slipping: 1, new: 2, active: 3 } as const

/** Searchable, sortable student list: a table on wide screens, cards on phones. */
/** `lastActiveLabel` is formatted on the server, in the app time zone. */
export type StudentRow = StudentSummary & { lastActiveLabel: string }

export const StudentTable = ({ students }: { students: StudentRow[] }) => {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('attention')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? students.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)) : students
    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'sets') return b.setsThisCycle - a.setsThisCycle
      if (sort === 'active') return (b.lastActive ?? '').localeCompare(a.lastActive ?? '')
      return attentionRank[a.status] - attentionRank[b.status] || a.name.localeCompare(b.name)
    })
  }, [students, query, sort])

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search students</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email" className="pl-9" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <ArrowDownUp className="size-4 text-muted-foreground" aria-hidden />
          <span className="sr-only">Sort by</span>
          <NativeSelect value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="sm:w-52">
            <option value="attention">Needs attention first</option>
            <option value="active">Last active</option>
            <option value="sets">Most sets</option>
            <option value="name">Name</option>
          </NativeSelect>
        </label>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">No students match “{query}”.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <ul className="divide-y md:hidden">
            {rows.map((s) => (
              <li key={s.id}>
                <Link href={`/educator/students/${s.id}`} className="flex items-center gap-3 p-4 hover:bg-accent">
                  <Avatar name={s.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge status={s.status} />
                      <span>{s.setsThisCycle} sets</span>
                      <span>· {s.lastActive ? s.lastActiveLabel : 'no practice yet'}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Sets (cycle)</th>
                <th className="px-3 py-3 font-medium">Last 8 weeks</th>
                <th className="px-5 py-3 text-right font-medium">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-accent/50">
                  <td className="px-5 py-3">
                    <Link href={`/educator/students/${s.id}`} className="flex items-center gap-3">
                      <Avatar name={s.name} className="size-8 text-xs" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium hover:text-primary">{s.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{s.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">
                    {s.setsThisCycle}
                    {s.cycle > 1 && <span className="block text-xs font-normal text-muted-foreground">cycle {s.cycle}</span>}
                  </td>
                  <td className="px-3 py-3">
                    <Sparkline values={s.weekly} />
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{s.lastActiveLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
