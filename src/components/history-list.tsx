import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { HistoryEntry } from '@/lib/practice'
import { formatDate } from '@/lib/utils'

export const HistoryList = ({
  entries,
  categoryNames,
  showCycle,
  linkSuffix = '',
  emptyText,
}: {
  entries: HistoryEntry[]
  categoryNames: Record<string, string>
  showCycle: boolean
  /** Appended to set links, e.g. "?student=…" for educators. */
  linkSuffix?: string
  emptyText: string
}) => {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">{emptyText}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <ul className="divide-y">
        {entries.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex-1">
              {entry.setId && entry.topic ? (
                <Link href={`/sets/${entry.setId}${linkSuffix}`} className="font-medium hover:text-primary hover:underline">
                  {entry.topic}
                </Link>
              ) : (
                <span className="font-medium text-muted-foreground">Set no longer available</span>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {entry.categoryId && categoryNames[entry.categoryId] && (
                  <Badge variant="secondary">{categoryNames[entry.categoryId]}</Badge>
                )}
                {entry.markedBy === 'educator' && <Badge variant="outline">Covered with educator</Badge>}
                {showCycle && <span>Cycle {entry.cycle}</span>}
              </div>
            </div>
            <time dateTime={entry.practisedAt} className="text-sm text-muted-foreground sm:text-right">
              {formatDate(entry.practisedAt)}
            </time>
          </li>
        ))}
      </ul>
    </Card>
  )
}
