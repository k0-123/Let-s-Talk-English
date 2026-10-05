import { CircleDashed, CircleCheck, CircleAlert, CircleMinus } from 'lucide-react'

import type { ActivityStatus } from '@/lib/progress'
import { cn } from '@/lib/utils'

const styles: Record<ActivityStatus, { label: string; icon: typeof CircleCheck; className: string }> = {
  active: { label: 'Active', icon: CircleCheck, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
  slipping: { label: 'Slipping', icon: CircleAlert, className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  inactive: { label: 'Inactive', icon: CircleMinus, className: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' },
  new: { label: 'Not started', icon: CircleDashed, className: 'bg-muted text-muted-foreground' },
}

/** Status always pairs an icon and a word with its colour. */
export const StatusBadge = ({ status, className }: { status: ActivityStatus; className?: string }) => {
  const s = styles[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', s.className, className)}>
      <s.icon className="size-3.5" aria-hidden />
      {s.label}
    </span>
  )
}
