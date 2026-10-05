import { cn } from '@/lib/utils'

export const Progress = ({
  value,
  max = 100,
  label,
  className,
  indicatorClassName,
}: {
  value: number
  max?: number
  label: string
  className?: string
  indicatorClassName?: string
}) => {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div className={cn('h-full rounded-full bg-primary transition-[width]', indicatorClassName)} style={{ width: `${pct}%` }} />
    </div>
  )
}
