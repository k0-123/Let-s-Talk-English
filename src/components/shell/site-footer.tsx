import Link from 'next/link'

import { Logo } from './logo'

export const SiteFooter = () => (
  <footer className="mt-16 hidden border-t bg-card sm:block">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground">
      <Logo className="opacity-80" />
      <nav className="flex gap-4">
        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link href="/terms" className="hover:text-foreground">Terms</Link>
      </nav>
    </div>
  </footer>
)
