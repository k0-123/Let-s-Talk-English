import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const EmptyState = ({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) => (
  <div className={cn('flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center', className)}>
    <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
      <Icon className="size-6" aria-hidden />
    </span>
    <h2 className="text-base font-semibold">{title}</h2>
    {children && <div className="max-w-sm text-sm text-muted-foreground">{children}</div>}
    {action}
  </div>
)
