import { ClipboardList, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AssignmentList } from '@/components/assignment-list'
import { FilterChips } from '@/components/filter-chips'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { listAssignments } from '@/lib/assignments'
import { requireUser } from '@/lib/auth'
import { dayKey } from '@/lib/dates'
import { getPayloadClient } from '@/lib/payload'
import { listCategories } from '@/lib/practice'

import { removeAssignmentAction } from '../actions'

export const metadata: Metadata = { title: 'Assignments' }

const FILTERS = [
  { key: 'open', label: 'To do' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'done', label: 'Done' },
  { key: 'all', label: 'All' },
] as const

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const educator = await requireUser(['educator'])
  const { show = 'open' } = await searchParams
  const payload = await getPayloadClient()
  const [assignments, categories] = await Promise.all([
    listAssignments(payload, educator, { today: dayKey(new Date()) }),
    listCategories(payload, educator),
  ])
  const filtered = assignments.filter((a) =>
    show === 'done' ? a.done : show === 'overdue' ? a.overdue : show === 'all' ? true : !a.done,
  )
  const counts = {
    open: assignments.filter((a) => !a.done).length,
    overdue: assignments.filter((a) => a.overdue).length,
    done: assignments.filter((a) => a.done).length,
    all: assignments.length,
  }

  return (
    <div>
      <PageHeader title="Assignments" description="Sets you asked your students to practise. Done means practised in their current cycle." />
      {assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          action={
            <Button asChild size="sm">
              <Link href="/educator">Pick a student</Link>
            </Button>
          }
        >
          Open a student, go to “Not done yet”, tick sets and assign them.
        </EmptyState>
      ) : (
        <>
          <FilterChips
            label="Filter assignments"
            chips={FILTERS.map((f) => ({
              label: `${f.label} (${counts[f.key]})`,
              href: `/educator/assignments?show=${f.key}`,
              active: show === f.key || (f.key === 'open' && !FILTERS.some((x) => x.key === show)),
            }))}
          />
          {filtered.length === 0 ? (
            <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">Nothing here.</p>
          ) : (
            <Card>
              <CardContent className="pt-2">
                <AssignmentList
                  assignments={filtered}
                  categoryNames={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
                  showStudent
                  linkSuffix={(a) => (a.studentId ? `?student=${a.studentId}` : '')}
                  actions={(a) => (
                    <form action={removeAssignmentAction}>
                      <input type="hidden" name="assignmentId" value={a.id} />
                      <button type="submit" aria-label={`Remove assignment ${a.topic ?? ''}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive">
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  )}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
