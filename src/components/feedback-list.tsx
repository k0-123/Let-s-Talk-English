import { ChevronDown, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { FeedbackCard } from '@/components/speaking/feedback-card'
import { EmptyState } from '@/components/ui/empty-state'
import type { FeedbackView } from '@/lib/ai-feedback'
import { formatDate } from '@/lib/utils'

/** Past AI feedback, newest first; each item expands to the full card. */
export const FeedbackList = ({ items, emptyText }: { items: FeedbackView[]; emptyText: string }) => {
  if (items.length === 0) {
    return (
      <EmptyState icon={Sparkles} title="No AI feedback yet">
        {emptyText}
      </EmptyState>
    )
  }
  return (
    <ul className="space-y-3">
      {items.map((f) => (
        <li key={f.id}>
          <details className="group rounded-xl border bg-card shadow-sm">
            <summary className="flex items-center gap-3 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-base font-bold tabular-nums text-primary">
                {f.result.estimatedBand.toFixed(1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{f.question}</span>
                <span className="text-xs text-muted-foreground">
                  {f.topic ?? 'Set'} · {formatDate(f.createdAt)}
                </span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="space-y-3 border-t p-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Answer</p>
                {f.answerText}
              </div>
              <FeedbackCard result={f.result} className="border-0 p-0 shadow-none" />
              {f.setId && (
                <Link href={`/sets/${f.setId}`} className="inline-block text-sm text-primary hover:underline">
                  Open the set
                </Link>
              )}
            </div>
          </details>
        </li>
      ))}
    </ul>
  )
}
