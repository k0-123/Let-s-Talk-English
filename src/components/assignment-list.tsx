import { CalendarClock, CheckCircle2, ChevronRight, CircleDot } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { AssignmentView } from '@/lib/assignments'
import { cn, formatDate } from '@/lib/utils'

/** Assignments with done / overdue state. Used by students (no names) and educators (with student names). */
export const AssignmentList = ({
  assignments,
  categoryNames,
  showStudent = false,
  linkSuffix = () => '',
  actions,
}: {
  assignments: AssignmentView[]
  categoryNames: Record<string, string>
  showStudent?: boolean
  linkSuffix?: (a: AssignmentView) => string
  actions?: (a: AssignmentView) => React.ReactNode
}) => (
  <ul className="divide-y">
    {assignments.map((a) => (
      <li key={a.id} className="flex items-start gap-3 py-3">
        {a.done ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Done" />
        ) : (
          <CircleDot className={cn('mt-0.5 size-5 shrink-0', a.overdue ? 'text-destructive' : 'text-primary')} aria-label={a.overdue ? 'Overdue' : 'To do'} />
        )}
        <div className="min-w-0 flex-1">
          {a.setId && a.topic ? (
            <Link href={`/sets/${a.setId}${linkSuffix(a)}`} className={cn('font-medium hover:text-primary hover:underline', a.done && 'text-muted-foreground')}>
              {a.topic}
            </Link>
          ) : (
            <span className="font-medium text-muted-foreground">Set no longer available</span>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {showStudent && a.studentName && <span className="font-medium text-foreground">{a.studentName}</span>}
            {a.categoryId && categoryNames[a.categoryId] && <Badge variant="secondary">{categoryNames[a.categoryId]}</Badge>}
            {a.dueDate && (
              <span className={cn('inline-flex items-center gap-1', a.overdue && 'font-medium text-destructive')}>
                <CalendarClock className="size-3.5" aria-hidden />
                {a.overdue ? 'Overdue · ' : 'Due '}
                {formatDate(a.dueDate)}
              </span>
            )}
            {a.done && <span>Done</span>}
          </div>
          {a.note && <p className="mt-1 text-sm text-muted-foreground">&ldquo;{a.note}&rdquo;</p>}
        </div>
        {actions ? actions(a) : !a.done && a.setId ? <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
      </li>
    ))}
  </ul>
)
