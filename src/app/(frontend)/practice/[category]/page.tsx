import { ArrowLeft, ChevronRight, PartyPopper } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/page-header'
import { ResetCycleForm } from '@/components/reset-cycle-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import {
  countUnpractisedByCategory,
  getCategoryBySlug,
  getNextSetsForStudent,
  listCategories,
} from '@/lib/practice'
import { plural } from '@/lib/utils'

export const metadata: Metadata = { title: 'New sets' }

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const student = await requireUser(['student'])
  const { category: slug } = await params
  const payload = await getPayloadClient()
  const category = await getCategoryBySlug(payload, student, slug)
  if (!category) notFound()

  const next = await getNextSetsForStudent(payload, student, category.id)

  const back = (
    <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
      <Link href="/practice">
        <ArrowLeft aria-hidden />
        All categories
      </Link>
    </Button>
  )

  if (next.sets.length === 0) {
    const categories = await listCategories(payload, student)
    const counts = await countUnpractisedByCategory(payload, student, student, categories)
    const others = categories.filter((c) => c.id !== category.id && counts[c.id]?.remaining > 0)
    const hasAnySets = counts[category.id]?.total > 0

    return (
      <div>
        {back}
        <Card className="text-center">
          <CardHeader className="items-center">
            {hasAnySets && <PartyPopper className="size-10 text-primary" aria-hidden />}
            <CardTitle className="text-2xl">
              {hasAnySets ? `You have practised every set in ${category.name}` : `No sets in ${category.name} yet`}
            </CardTitle>
            <CardDescription>
              {hasAnySets
                ? 'Great work. Try another category, or start a new cycle to go through the sets again.'
                : 'Please check back soon, or try another category.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {others.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {others.map((c) => (
                  <Button key={c.id} asChild>
                    <Link href={`/practice/${c.slug}`}>
                      Practise {c.name} ({counts[c.id].remaining} new)
                    </Link>
                  </Button>
                ))}
              </div>
            )}
            {hasAnySets && <ResetCycleForm variant={others.length ? 'outline' : 'default'} />}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {back}
      <PageHeader
        title={category.name}
        description={`Here are your next sets. ${plural(next.remaining, 'new set')} left in this category.`}
      />
      <ol className="space-y-3">
        {next.sets.map((set, index) => (
          <li key={set.id}>
            <Link
              href={`/sets/${set.id}`}
              className="group flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary sm:p-5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                {index + 1}
              </span>
              <span className="flex-1">
                <span className="block font-semibold" data-testid="set-topic">
                  {set.topic}
                </span>
                <span className="text-sm text-muted-foreground">{plural(set.questionCount, 'question')}</span>
              </span>
              <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
