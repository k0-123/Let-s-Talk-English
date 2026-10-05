import { ArrowRight, BookOpen, CalendarDays, Flame, Gauge, History, Sparkles, Target } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { relationId } from '@/access'
import { AssignmentList } from '@/components/assignment-list'
import { ActivityHeatmap } from '@/components/charts/activity-heatmap'
import { GoalRing } from '@/components/charts/goal-ring'
import { OnboardingChecklist } from '@/components/onboarding-checklist'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/ui/stat-card'
import { feedbackUsedToday, isAiFeedbackEnabled } from '@/lib/ai-feedback'
import { listAssignments } from '@/lib/assignments'
import { requireUser } from '@/lib/auth'
import { dayKey } from '@/lib/dates'
import { getPayloadClient } from '@/lib/payload'
import { countUnpractisedByCategory, getHistory, listCategories } from '@/lib/practice'
import { getStudentProgress } from '@/lib/progress'
import { formatDate, plural } from '@/lib/utils'

export const metadata: Metadata = { title: 'Home' }

const greeting = () => {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: process.env.TZ || 'UTC' }).format(new Date()))
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export default async function DashboardPage() {
  const student = await requireUser(['student'])
  const payload = await getPayloadClient()

  const [progress, categories, assignments, recent] = await Promise.all([
    getStudentProgress(payload, student, student),
    listCategories(payload, student),
    listAssignments(payload, student, { today: dayKey(new Date()) }),
    getHistory(payload, student, { studentId: student.id, limit: 5 }),
  ])
  const counts = await countUnpractisedByCategory(payload, student, student, categories)
  const visibleCategories = categories.filter((c) => counts[c.id]?.total > 0)
  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const openAssignments = assignments.filter((a) => !a.done)
  const aiUsed = isAiFeedbackEnabled() ? await feedbackUsedToday(payload, student.id) : 0
  const nextCategory = visibleCategories.find((c) => counts[c.id].remaining > 0)
  const firstName = student.name.split(' ')[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{greeting()}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{firstName}, ready to speak?</h1>
        </div>
        <Button asChild size="lg">
          <Link href={openAssignments[0]?.setId ? `/sets/${openAssignments[0].setId}` : nextCategory ? `/practice/${nextCategory.slug}` : '/practice'}>
            {openAssignments.length ? 'Start your assignment' : 'Continue practising'} <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>

      {!student.onboardingDismissed && (
        <OnboardingChecklist
          title="Getting started"
          steps={[
            { label: 'Create your account', done: true },
            { label: 'Join your educator with their invite code', done: Boolean(relationId(student.educator)), href: '/join' },
            { label: 'Practise your first set', done: progress.totalAllTime > 0, href: '/practice' },
            { label: 'Practise on 3 days in a row', done: progress.streak.best >= 3 },
          ]}
        />
      )}

      <section aria-label="This week" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="col-span-2 flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm lg:col-span-1">
          <GoalRing value={progress.thisWeek} goal={progress.weeklyGoal} size={76} />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Weekly goal</p>
            <p className="font-semibold">
              {progress.thisWeek >= progress.weeklyGoal ? 'Goal reached!' : `${progress.weeklyGoal - progress.thisWeek} to go`}
            </p>
            <Link href="/account" className="text-xs text-primary hover:underline">
              Change goal
            </Link>
          </div>
        </div>
        <StatCard
          icon={Flame}
          tone="streak"
          label="Day streak"
          value={progress.streak.current}
          hint={progress.streak.practisedToday ? 'Practised today' : progress.streak.current ? 'Practise today to keep it' : `Best: ${progress.streak.best}`}
        />
        <StatCard icon={Target} label="Sets this cycle" value={progress.totalThisCycle} hint={`${progress.totalAllTime} all time`} />
        <StatCard
          icon={Gauge}
          tone="success"
          label="Average confidence"
          value={progress.averageConfidence ? `${progress.averageConfidence.toFixed(1)} / 5` : '—'}
          hint={progress.averageConfidence ? 'From your self-ratings' : 'Rate yourself after a set'}
        />
      </section>

      {assignments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Assigned by your educator</CardTitle>
            <CardDescription>
              {openAssignments.length ? `${plural(openAssignments.length, 'set')} to do` : 'All done. Nice work!'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssignmentList assignments={assignments.slice(0, 6)} categoryNames={categoryNames} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-primary" aria-hidden /> Practice calendar
            </CardTitle>
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
            <CardDescription>Sets practised in this cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {visibleCategories.length === 0 && <p className="text-sm text-muted-foreground">No sets yet.</p>}
            {visibleCategories.map((c) => {
              const { remaining, total } = counts[c.id]
              const done = total - remaining
              return (
                <Link key={c.id} href={`/practice/${c.slug}`} className="block space-y-1.5 rounded-lg p-1 hover:bg-accent/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {done} / {total}
                    </span>
                  </div>
                  <Progress value={done} max={total} label={`${c.name}: ${done} of ${total} sets practised`} indicatorClassName={done === total ? 'bg-success' : undefined} />
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4 text-primary" aria-hidden /> Recent practice
            </CardTitle>
            <Link href="/history" className="text-sm text-primary hover:underline">
              See all
            </Link>
          </CardHeader>
          <CardContent>
            {recent.entries.length === 0 ? (
              <EmptyState icon={BookOpen} title="No practice yet" className="border-0 py-6" action={<Button asChild size="sm"><Link href="/practice">Pick a category</Link></Button>}>
                Your practised sets will appear here.
              </EmptyState>
            ) : (
              <ul className="divide-y">
                {recent.entries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      {e.setId && e.topic ? (
                        <Link href={`/sets/${e.setId}`} className="truncate font-medium hover:text-primary hover:underline">
                          {e.topic}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Set no longer available</span>
                      )}
                      {e.categoryId && <Badge variant="secondary" className="ml-2">{categoryNames[e.categoryId]}</Badge>}
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground" dateTime={e.practisedAt}>
                      {formatDate(e.practisedAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {isAiFeedbackEnabled() && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-primary" aria-hidden /> AI feedback
              </CardTitle>
              <CardDescription>Speak or type an answer on any set, then tap &ldquo;Get feedback&rdquo;.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                <span className="font-semibold tabular-nums">{aiUsed}</span> used today
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/history/feedback">See your feedback</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
