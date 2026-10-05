import { MessagesSquare } from 'lucide-react'

import { cn } from '@/lib/utils'

export const Logo = ({ className }: { className?: string }) => (
  <span className={cn('inline-flex items-center gap-2', className)}>
    <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
      <MessagesSquare className="size-4.5" aria-hidden />
    </span>
    <span className="text-base font-bold tracking-tight">
      Let&apos;s Talk <span className="text-primary">English</span>
    </span>
  </span>
)
