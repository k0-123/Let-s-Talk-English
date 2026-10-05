'use client'

import { RefreshCw, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-10">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        action={
          <Button onClick={reset}>
            <RefreshCw aria-hidden /> Try again
          </Button>
        }
      >
        Please try again. If it keeps happening, log out and back in, or contact your educator.
      </EmptyState>
    </div>
  )
}
