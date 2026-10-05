import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { FilterChips } from '@/components/filter-chips'
import { HistoryList } from '@/components/history-list'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { SubmitButton } from '@/components/submit-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { getOwnStudent } from '@/lib/educator'
import { getPayloadClient } from '@/lib/payload'
import { findUnpractisedSets, getHistory, listCategories } from '@/lib/practice'
import { pageNumber, toQuery } from '@/lib/query'
import { cn, plural } from '@/lib/utils'

import { markCoveredAction } from '../../actions'

export const metadata: Metadata = { title: 'Student' }

const TODO_PAGE_SIZE = 10

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; category?: string; page?: string }>
}) {
  const educator = await requireUser(['educator'])
  const { id } = await params
  const query = await searchParams
  const payload = await getPayloadClient()

  const student = await getOwnStudent(payload, educator, id)
  if (!student) notFound()

  const tab = query.tab === 'todo' ? 'todo' : 'history'
  const tabParam = tab === 'todo' ? tab : null
  const categories = await listCategories(payload, educator)
  const active = categories.find((c) => c.slug === query.category) ?? null
  const page = pageNumber(query.page)
  const base = `/educator/students/${student.id}`
  const cycle = student.cycle ?? 1
  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const tabs = [
    { key: 'history', label: 'History' },
    { key: 'todo', label: 'Not done yet' },
  ] as const

  const categoryChips = [
    { label: 'All categories', href: `${base}${toQuery({ tab: tabParam })}`, active: !active },
    ...categories.map((c) => ({
      label: c.name,
      href: `${base}${toQuery({ tab: tabParam, category: c.slug })}`,
      active: active?.id === c.id,
    })),
  ]

  let body: React.ReactNode
  if (tab === 'history') {
    const history = await getHistory(payload, educator, { studentId: student.id, categoryId: active?.id, page })
    body = (
      <>
        <HistoryList
          entries={history.entries}
          categoryNames={categoryNames}
          showCycle={cycle > 1}
          linkSuffix={toQuery({ student: student.id })}
          emptyText={active ? `No ${active.name} sets practised yet.` : 'No sets practised yet.'}
        />
        <Pagination
          page={history.page}
          totalPages={history.totalPages}
          hrefFor={(p) => `${base}${toQuery({ tab: tabParam, category: active?.slug, page: p })}`}
        />
      </>
    )
  } else {
    const todo = await findUnpractisedSets(payload, educator, {
      student,
      categoryId: active?.id,
      limit: TODO_PAGE_SIZE,
      page,
    })
    body = (
      <>
        <p className="mb-3 text-sm text-muted-foreground">
          {plural(todo.remaining, 'set')} {student.name} has not done
          {cycle > 1 ? ' in their current cycle' : ''}
          {active ? ` in ${active.name}` : ''}. Open one to use it in a session, or mark it as covered.
        </p>
        {todo.sets.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Nothing left here. {student.name} has done every set{active ? ` in ${active.name}` : ''}.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y">
              {todo.sets.map((set) => (
                <li key={set.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <Link
                      href={`/sets/${set.id}${toQuery({ student: student.id })}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {set.topic}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {!active && set.categoryId && categoryNames[set.categoryId] && `${categoryNames[set.categoryId]} · `}
                      {plural(set.questionCount, 'question')}
                    </p>
                  </div>
                  <form action={markCoveredAction}>
                    <input type="hidden" name="studentId" value={student.id} />
                    <input type="hidden" name="setId" value={set.id} />
                    <SubmitButton variant="outline" size="sm" pendingText="Saving…" className="w-full sm:w-auto">
                      Mark as covered
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Pagination
          page={todo.page}
          totalPages={todo.totalPages}
          hrefFor={(p) => `${base}${toQuery({ tab: tabParam, category: active?.slug, page: p })}`}
        />
      </>
    )
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
        <Link href="/educator">
          <ArrowLeft aria-hidden />
          My students
        </Link>
      </Button>
      <PageHeader
        title={student.name}
        description={
          <>
            {student.email}
            {cycle > 1 && ` · practice cycle ${cycle}`}
          </>
        }
      />

      <nav aria-label="Student views" className="mb-4 flex gap-1 border-b">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`${base}${toQuery({ tab: t.key === 'todo' ? t.key : null, category: active?.slug })}`}
            aria-current={tab === t.key ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium',
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <FilterChips label="Filter by category" chips={categoryChips} />
      {body}
    </div>
  )
}
