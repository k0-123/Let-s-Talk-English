import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3 max-w-sm" />
        <Skeleton className="h-4 w-1/2 max-w-xs" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-32" />
    </div>
  )
}
