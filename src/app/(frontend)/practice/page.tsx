import { ChevronRight, UserPlus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHeader } from '@/components/page-header'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { countUnpractisedByCategory, listCategories } from '@/lib/practice'
import { plural } from '@/lib/utils'

export const metadata: Metadata = { title: 'Practice' }

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ newCycle?: string }> }) {
  const student = await requireUser(['student'])
  const { newCycle } = await searchParams
  const payload = await getPayloadClient()
  const categories = await listCategories(payload, student)
  const counts = await countUnpractisedByCategory(payload, student, student, categories)
  const visible = categories.filter((c) => counts[c.id]?.total > 0)

  return (
    <div>
      <PageHeader
        title={`Hi ${student.name.split(' ')[0]}, what would you like to practise?`}
        description="Pick a category to get a few question sets you have not done yet."
      />

      {newCycle && (
        <Alert variant="success" className="mb-4">
          A new practice cycle has started. Every set is new again, and your earlier history is kept.
        </Alert>
      )}

      {!student.educator && (
        <Alert variant="info" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Have an invite code from your educator? Join them so they can follow your practice.</span>
          <Button asChild size="sm" variant="outline">
            <Link href="/join">
              <UserPlus aria-hidden />
              Join my educator
            </Link>
          </Button>
        </Alert>
      )}

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            There are no question sets available yet. Please check back soon.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((category) => {
            const { remaining, total } = counts[category.id]
            return (
              <li key={category.id}>
                <Link
                  href={`/practice/${category.slug}`}
                  className="group flex h-full items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-colors hover:border-primary"
                >
                  <div className="flex-1 space-y-1">
                    <h2 className="text-lg font-semibold">{category.name}</h2>
                    {category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
                    <p className="text-sm font-medium text-primary">
                      {remaining > 0 ? `${plural(remaining, 'new set')} of ${total}` : 'All sets practised'}
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
