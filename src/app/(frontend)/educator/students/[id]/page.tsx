import { ArrowLeft, BookOpen, CalendarDays, Download, Flame, Gauge, Search, StickyNote, Target, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AssignmentList } from '@/components/assignment-list'
import { ActivityHeatmap } from '@/components/charts/activity-heatmap'
import { AssignForm } from '@/components/educator/assign-form'
import { NoteForm } from '@/components/educator/note-form'
import { FeedbackList } from '@/components/feedback-list'
import { FilterChips } from '@/components/filter-chips'
import { HistoryList } from '@/components/history-list'
import { Pagination } from '@/components/pagination'
import { StatusBadge } from '@/components/status-badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/ui/stat-card'
import { listFeedback } from '@/lib/ai-feedback'
import { listAssignments } from '@/lib/assignments'
import { requireUser } from '@/lib/auth'
import { dayKey } from '@/lib/dates'
import { getOwnStudent } from '@/lib/educator'
import { listNotes } from '@/lib/notes'
import { getPayloadClient } from '@/lib/payload'
import { countUnpractisedByCategory, findUnpractisedSets, getHistory, listCategories } from '@/lib/practice'
import { getActivityStatus, getStudentProgress } from '@/lib/progress'
import { pageNumber, toQuery } from '@/lib/query'
import { cn, formatDate, plural } from '@/lib/utils'

import { deleteNoteAction, removeAssignmentAction } from '../../actions'

export const metadata: Metadata = { title: 'Student' }

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'history', label: 'History' },
  { key: 'todo', label: 'Not done yet' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'notes', label: 'Notes' },
  { key: 'feedback', label: 'AI feedback' },
] as const
type Tab = (typeof TABS)[number]['key']

const TODO_PAGE_SIZE = 10

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; category?: string; page?: string; q?: string }>
}) {
  const educator = await requireUser(['educator'])
  const { id } = await params
  const query = await searchParams
  const payload = await getPayloadClient()

  const student = await getOwnStudent(payload, educator, id)
  if (!student) notFound()

  const tab: Tab = TABS.some((t) => t.key === query.tab) ? (query.tab as Tab) : 'overview'
  const categories = await listCategories(payload, educator)
  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const active = categories.find((c) => c.slug === query.category) ?? null
  const page = pageNumber(query.page)
  const base = `/educator/students/${student.id}`
  const cycle = student.cycle ?? 1
  const progress = await getStudentProgress(payload, educator, student)
  const lastPractice = progress.recent[0]?.practisedAt ?? null
  const status = getActivityStatus(lastPractice ? dayKey(lastPractice) : null, dayKey(new Date()))
  const href = (params: Record<string, string | number | null | undefined>) => `${base}${toQuery(params)}`

  const categoryChips = (t: Tab) => [
    { label: 'All', href: href({ tab: t }), active: !active },
    ...categories.map((c) => ({ label: c.name, href: href({ tab: t, category: c.slug }), active: active?.id === c.id })),
  ]

  let body: React.ReactNode = null

  if (tab === 'overview') {
    const counts = await countUnpractisedByCategory(payload, educator, student, categories)
    body = (
      <div className="space-y-5">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Target} label="Sets this cycle" value={progress.totalThisCycle} hint={`${progress.totalAllTime} all time`} />
          <StatCard icon={CalendarDays} label="This week" value={`${progress.thisWeek} / ${progress.weeklyGoal}`} hint="Against their goal" />
          <StatCard icon={Flame} tone="streak" label="Day streak" value={progress.streak.current} hint={`Best ${progress.streak.best}`} />
          <StatCard icon={Gauge} tone="success" label="Avg confidence" value={progress.averageConfidence ? `${progress.averageConfidence.toFixed(1)} / 5` : '—'} />
        </section>
        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Practice calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap days={progress.activity} today={dayKey(new Date())} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="size-4 text-primary" aria-hidden /> Progress by part
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories
                .filter((c) => counts[c.id]?.total > 0)
                .map((c) => {
                  const done = counts[c.id].total - counts[c.id].remaining
                  return (
                    <div key={c.id} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{c.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {done} / {counts[c.id].total}
                        </span>
                      </div>
                      <Progress value={done} max={counts[c.id].total} label={`${c.name}: ${done} of ${counts[c.id].total}`} />
                    </div>
                  )
                })}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } else if (tab === 'history') {
    const history = await getHistory(payload, educator, { studentId: student.id, categoryId: active?.id, page })
    body = (
      <>
        <FilterChips label="Filter by category" chips={categoryChips('history')} />
        <HistoryList
          entries={history.entries}
          categoryNames={categoryNames}
          showCycle={cycle > 1}
          linkSuffix={toQuery({ student: student.id })}
          emptyText={active ? `No ${active.name} sets practised yet.` : 'No sets practised yet.'}
        />
        <Pagination page={history.page} totalPages={history.totalPages} hrefFor={(p) => href({ tab, category: active?.slug, page: p })} />
      </>
    )
  } else if (tab === 'todo') {
    const [todo, assignments] = await Promise.all([
      findUnpractisedSets(payload, educator, { student, categoryId: active?.id, search: query.q, limit: TODO_PAGE_SIZE, page }),
      listAssignments(payload, educator, { studentId: student.id }),
    ])
    body = (
      <>
        <FilterChips label="Filter by category" chips={categoryChips('todo')} />
        <form className="relative mb-3" action={base}>
          <input type="hidden" name="tab" value="todo" />
          {active && <input type="hidden" name="category" value={active.slug} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={query.q ?? ''} placeholder="Search topics" className="pl-9" aria-label="Search topics" />
        </form>
        <p className="mb-3 text-sm text-muted-foreground">
          {plural(todo.remaining, 'set')} {student.name} has not done{cycle > 1 ? ' in their current cycle' : ''}
          {active ? ` in ${active.name}` : ''}. Tick sets to assign them, or mark one as covered after a live session.
        </p>
        {todo.sets.length === 0 ? (
          <EmptyState icon={BookOpen} title="Nothing here">
            {query.q ? `No unpractised sets match “${query.q}”.` : `${student.name} has done every set${active ? ` in ${active.name}` : ''}.`}
          </EmptyState>
        ) : (
          <AssignForm
            studentId={student.id}
            studentName={student.name}
            sets={todo.sets}
            categoryNames={categoryNames}
            assignedSetIds={assignments.map((a) => a.setId).filter((x): x is string => !!x)}
          />
        )}
        <Pagination page={todo.page} totalPages={todo.totalPages} hrefFor={(p) => href({ tab, category: active?.slug, q: query.q, page: p })} />
      </>
    )
  } else if (tab === 'assignments') {
    const assignments = await listAssignments(payload, educator, { studentId: student.id, today: dayKey(new Date()) })
    body =
      assignments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No assignments yet"
          action={
            <Button asChild size="sm">
              <Link href={href({ tab: 'todo' })}>Choose sets to assign</Link>
            </Button>
          }
        >
          Assigned sets appear first on {student.name}&apos;s home screen.
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="pt-2">
            <AssignmentList
              assignments={assignments}
              categoryNames={categoryNames}
              linkSuffix={() => toQuery({ student: student.id })}
              actions={(a) => (
                <form action={removeAssignmentAction}>
                  <input type="hidden" name="assignmentId" value={a.id} />
                  <input type="hidden" name="studentId" value={student.id} />
                  <button type="submit" aria-label={`Remove assignment ${a.topic ?? ''}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </form>
              )}
            />
          </CardContent>
        </Card>
      )
  } else if (tab === 'notes') {
    const notes = await listNotes(payload, educator, student.id)
    body = (
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <NoteForm studentId={student.id} />
            <p className="mt-3 text-xs text-muted-foreground">Only you can see your notes. {student.name} cannot.</p>
          </CardContent>
        </Card>
        <div className="lg:col-span-3">
          {notes.length === 0 ? (
            <EmptyState icon={StickyNote} title="No notes yet">
              Keep track of what you worked on and what to focus on next.
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li key={note.id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                    <form action={deleteNoteAction}>
                      <input type="hidden" name="noteId" value={note.id} />
                      <input type="hidden" name="studentId" value={student.id} />
                      <button type="submit" aria-label="Delete note" className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-destructive">
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  } else {
    const feedback = await listFeedback(payload, educator, { studentId: student.id, limit: 30 })
    body = <FeedbackList items={feedback} emptyText={`${student.name} has not asked for AI feedback yet.`} />
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
        <Link href="/educator">
          <ArrowLeft aria-hidden />
          My students
        </Link>
      </Button>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} className="size-14 text-lg" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight">{student.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge status={status} />
              <span className="truncate">{student.email}</span>
              {cycle > 1 && <span>· cycle {cycle}</span>}
            </div>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`${base}/export`} download>
            <Download aria-hidden /> Export history
          </a>
        </Button>
      </div>

      <nav aria-label="Student views" className="-mx-4 mb-5 overflow-x-auto px-4">
        <div className="flex min-w-max gap-1 border-b">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={href({ tab: t.key === 'overview' ? null : t.key })}
              aria-current={tab === t.key ? 'page' : undefined}
              className={cn(
                '-mb-px border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap',
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      {body}
    </div>
  )
}
