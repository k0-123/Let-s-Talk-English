import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="space-y-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">This page does not exist, or you do not have access to it.</p>
      <Button asChild>
        <Link href="/">Go to the home page</Link>
      </Button>
    </div>
  )
}
