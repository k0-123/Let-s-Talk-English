import { ArrowLeft, BookOpen, CheckCircle2, ChevronDown, Lightbulb } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { relationId } from '@/access'
import { MarkPractisedForm } from '@/components/mark-practised-form'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { getOwnStudent } from '@/lib/educator'
import { getPayloadClient } from '@/lib/payload'
import { findCurrentLog, getQuestionSet } from '@/lib/practice'
import { formatDate } from '@/lib/utils'
import type { Category, Media, User } from '@/payload-types'

export const metadata: Metadata = { title: 'Question set' }

const Reveal = ({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) => (
  <details className="group rounded-md border bg-muted/40">
    <summary className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary">
      {icon}
      <span className="flex-1">{label}</span>
      <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
    </summary>
    <div className="border-t px-4 py-3 text-sm leading-relaxed">{children}</div>
  </details>
)

const Paragraphs = ({ text }: { text: string }) => (
  <div className="space-y-2">
    {text.split(/\n+/).map((line, i) => (
      <p key={i}>{line}</p>
    ))}
  </div>
)

export default async function QuestionSetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ student?: string }>
}) {
  const user = await requireUser(['student', 'educator', 'admin'])
  const { id } = await params
  const { student: studentParam } = await searchParams
  const payload = await getPayloadClient()

  const set = await getQuestionSet(payload, user, id)
  if (!set) notFound()

  const category = typeof set.category === 'object' ? (set.category as Category) : null
  const image = typeof set.image === 'object' ? (set.image as Media | null) : null

  // Who is this set being recorded for?
  let target: User | null = null
  if (user.role === 'student') target = user
  else if (user.role === 'educator' && studentParam) target = await getOwnStudent(payload, user, studentParam)
  const existingLog = target ? await findCurrentLog(payload, user, target, set.id) : null

  const nextHref =
    user.role === 'educator' && target
      ? `/educator/students/${target.id}?tab=todo`
      : category
        ? `/practice/${category.slug}`
        : '/practice'

  const backHref =
    user.role === 'educator'
      ? target
        ? `/educator/students/${target.id}?tab=todo`
        : '/educator'
      : user.role === 'admin'
        ? `/admin/collections/question-sets/${set.id}`
        : category
          ? `/practice/${category.slug}`
          : '/practice'

  return (
    <article className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href={backHref}>
            <ArrowLeft aria-hidden />
            Back
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {category && <Badge variant="secondary">{category.name}</Badge>}
          {user.role === 'admin' && set.status === 'draft' && <Badge variant="outline">Draft</Badge>}
          {existingLog && (
            <Badge variant="success">
              {user.role === 'student' ? 'Practised' : 'Done'} {formatDate(existingLog.practisedAt)}
            </Badge>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{set.topic}</h1>
        {target && user.role === 'educator' && (
          <p className="mt-1 text-muted-foreground">Live session with {target.name}</p>
        )}
      </div>

      {image?.url && (
        // eslint-disable-next-line @next/next/no-img-element -- images need the login cookie, so skip next/image
        <img src={image.url} alt={image.alt ?? ''} className="max-h-80 w-full rounded-lg border object-cover" />
      )}

      <Card>
        <CardContent className="space-y-6 pt-5 sm:pt-6">
          <p className="text-sm text-muted-foreground">
            Answer each question out loud first. Then open the sample answer to compare.
          </p>
          <ol className="space-y-6">
            {set.questions.map((q, index) => (
              <li key={q.id ?? index} className="space-y-3">
                <div className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div className="pt-0.5 text-base font-medium leading-relaxed sm:text-lg">
                    <Paragraphs text={q.question} />
                  </div>
                </div>
                {q.answer && (
                  <div className="pl-10">
                    <Reveal label="Show sample answer">
                      <Paragraphs text={q.answer} />
                    </Reveal>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {Boolean(set.vocabulary?.length || set.tips) && (
        <div className="space-y-3">
          {set.vocabulary && set.vocabulary.length > 0 && (
            <Reveal label={`Useful vocabulary (${set.vocabulary.length})`} icon={<BookOpen className="size-4" aria-hidden />}>
              <dl className="space-y-2">
                {set.vocabulary.map((v, i) => (
                  <div key={v.id ?? i}>
                    <dt className="font-semibold">{v.term}</dt>
                    {v.meaning && <dd className="text-muted-foreground">{v.meaning}</dd>}
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
          {set.tips && (
            <Reveal label="Tips" icon={<Lightbulb className="size-4" aria-hidden />}>
              <Paragraphs text={set.tips} />
            </Reveal>
          )}
        </div>
      )}

      {target && (
        <Card className="border-primary/30">
          <CardContent className="space-y-3 pt-5 sm:pt-6">
            {existingLog ? (
              <>
                <Alert variant="success" className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
                  {user.role === 'student'
                    ? `Practised on ${formatDate(existingLog.practisedAt)}. It is in your history and will not be offered to you again in this cycle.`
                    : `${target.name} has done this set (${formatDate(existingLog.practisedAt)}).`}
                </Alert>
                <Button asChild size="lg" className="w-full" variant={user.role === 'student' ? 'default' : 'outline'}>
                  <Link href={nextHref}>{user.role === 'student' ? 'Next set' : 'Back to student'}</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {user.role === 'student'
                    ? 'Finished? Mark the set as practised so it is saved to your history and your educator can see it.'
                    : `Covered this set with ${target.name} in your session? Mark it so it is not offered to them again.`}
                </p>
                <MarkPractisedForm
                  setId={set.id}
                  studentId={user.role === 'educator' ? target.id : undefined}
                  label={user.role === 'student' ? 'Mark as practised' : `Mark as covered for ${target.name}`}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {user.role === 'student' && !relationId(user.educator) && (
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/join" className="text-primary hover:underline">
            Join your educator
          </Link>{' '}
          so they can see what you have practised.
        </p>
      )}
    </article>
  )
}
