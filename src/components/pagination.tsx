import Link from 'next/link'

import { Button } from '@/components/ui/button'

/** Previous/next links that keep the other query parameters. */
export const Pagination = ({
  page,
  totalPages,
  hrefFor,
}: {
  page: number
  totalPages: number
  hrefFor: (page: number) => string
}) => {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-2">
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefFor(page - 1)}>Previous</Link>
        </Button>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefFor(page + 1)}>Next</Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  )
}
