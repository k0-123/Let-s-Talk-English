import Link from 'next/link'

import { cn } from '@/lib/utils'

export type Chip = { label: string; href: string; active: boolean }

export const FilterChips = ({ chips, label }: { chips: Chip[]; label: string }) => (
  <nav aria-label={label} className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
    {chips.map((chip) => (
      <Link
        key={chip.href}
        href={chip.href}
        aria-current={chip.active ? 'page' : undefined}
        className={cn(
          'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
          chip.active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent',
        )}
      >
        {chip.label}
      </Link>
    ))}
  </nav>
)
