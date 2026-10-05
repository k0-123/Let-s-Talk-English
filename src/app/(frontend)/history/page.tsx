import type { Metadata } from 'next'

import { FilterChips } from '@/components/filter-chips'
import { HistoryList } from '@/components/history-list'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { ResetCycleForm } from '@/components/reset-cycle-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { getHistory, listCategories } from '@/lib/practice'
import { pageNumber, toQuery } from '@/lib/query'
import { plural } from '@/lib/utils'

export const metadata: Metadata = { title: 'My history' }

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const student = await requireUser(['student'])
  const params = await searchParams
  const payload = await getPayloadClient()

  const categories = await listCategories(payload, student)
  const active = categories.find((c) => c.slug === params.category) ?? null
  const page = pageNumber(params.page)
  const history = await getHistory(payload, student, { studentId: student.id, categoryId: active?.id, page })
  const thisCycle = await payload.count({
    collection: 'practice-logs',
    where: { and: [{ student: { equals: student.id } }, { cycle: { equals: student.cycle ?? 1 } }] },
    overrideAccess: false,
    user: student,
  })

  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const cycle = student.cycle ?? 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="My practice history"
        description={
          cycle > 1
            ? `You are on practice cycle ${cycle}. ${plural(thisCycle.totalDocs, 'set')} practised in this cycle.`
            : `${plural(thisCycle.totalDocs, 'set')} practised so far.`
        }
      />

      <div>
        <FilterChips
          label="Filter by category"
          chips={[
            { label: 'All', href: '/history', active: !active },
            ...categories.map((c) => ({
              label: c.name,
              href: `/history${toQuery({ category: c.slug })}`,
              active: active?.id === c.id,
            })),
          ]}
        />
        <HistoryList
          entries={history.entries}
          categoryNames={categoryNames}
          showCycle={cycle > 1}
          emptyText={active ? `You have not practised any ${active.name} sets yet.` : 'You have not practised any sets yet.'}
        />
        <Pagination
          page={history.page}
          totalPages={history.totalPages}
          hrefFor={(p) => `/history${toQuery({ category: active?.slug, page: p })}`}
        />
      </div>

      {thisCycle.totalDocs > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preparing for another test?</CardTitle>
            <CardDescription>
              Start a new practice cycle and every set becomes new again. This history stays here, and your
              educator can still see it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetCycleForm />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
