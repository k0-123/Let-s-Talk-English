import Link from 'next/link'

import { cn } from '@/lib/utils'

export const HistoryTabs = ({ active }: { active: 'practice' | 'feedback' }) => (
  <nav aria-label="History views" className="mb-5 inline-flex rounded-lg border bg-muted p-1">
    {[
      { key: 'practice', href: '/history', label: 'Practice' },
      { key: 'feedback', href: '/history/feedback', label: 'AI feedback' },
    ].map((tab) => (
      <Link
        key={tab.key}
        href={tab.href}
        aria-current={active === tab.key ? 'page' : undefined}
        className={cn(
          'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
          active === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {tab.label}
      </Link>
    ))}
  </nav>
)
