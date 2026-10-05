import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'primary',
  className,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'primary' | 'streak' | 'success' | 'warning'
  className?: string
}) => {
  const tones = {
    primary: 'bg-secondary text-primary',
    streak: 'bg-orange-100 text-streak dark:bg-orange-500/15',
    success: 'bg-emerald-100 text-success dark:bg-emerald-500/15',
    warning: 'bg-amber-100 text-warning dark:bg-amber-500/15',
  }
  return (
    <div className={cn('flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:p-4', className)}>
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10', tones[tone])}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-bold leading-tight tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground sm:truncate">{hint}</p>}
      </div>
    </div>
  )
}
