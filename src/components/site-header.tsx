import Link from 'next/link'

import { logoutAction } from '@/app/(frontend)/auth-actions'
import { Button } from '@/components/ui/button'
import { SITE_NAME } from '@/lib/constants'
import type { User } from '@/payload-types'

const linksFor = (user: User | null): { href: string; label: string }[] => {
  if (!user) return []
  if (user.role === 'student') {
    return [
      { href: '/practice', label: 'Practice' },
      { href: '/history', label: 'History' },
      { href: '/join', label: 'My educator' },
    ]
  }
  if (user.role === 'educator' && user.approved) return [{ href: '/educator', label: 'My students' }]
  if (user.role === 'admin') {
    return [
      { href: '/admin', label: 'Admin panel' },
      { href: '/import', label: 'Bulk import' },
    ]
  }
  return []
}

export const SiteHeader = ({ user }: { user: User | null }) => {
  const links = linksFor(user)
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="mr-auto text-base font-semibold text-primary">
          {SITE_NAME}
        </Link>
        {user ? (
          <form action={logoutAction} className="order-2 sm:order-3">
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        ) : (
          <nav className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Sign up</Link>
            </Button>
          </nav>
        )}
        {links.length > 0 && (
          <nav
            aria-label="Main"
            className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-2 sm:mx-0 sm:w-auto"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
