import { LogOut, Settings, UserRound } from 'lucide-react'
import Link from 'next/link'

import { logoutAction } from '@/app/(frontend)/auth-actions'
import { Logo } from '@/components/shell/logo'
import { NavLinks } from '@/components/shell/nav-links'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { User } from '@/payload-types'

const roleLabel: Record<User['role'], string> = { student: 'Student', educator: 'Educator', admin: 'Admin' }

const UserMenu = ({ user }: { user: User }) => (
  <details className="group relative">
    <summary
      aria-label="Account menu"
      className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-accent sm:pr-3"
    >
      <Avatar name={user.name} className="size-8 text-xs" />
      <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{user.name.split(' ')[0]}</span>
    </summary>
    <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border bg-card shadow-lg">
      <div className="border-b px-4 py-3">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <p className="mt-1 text-xs font-medium text-primary">{roleLabel[user.role]}</p>
      </div>
      <div className="p-1">
        <Link href="/account" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent">
          <Settings className="size-4" aria-hidden /> Account and settings
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
            <LogOut className="size-4" aria-hidden /> Log out
          </button>
        </form>
      </div>
    </div>
  </details>
)

export const SiteHeader = ({ user }: { user: User | null }) => (
  <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
    <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
      <Link href="/" className="mr-auto" aria-label="Let's Talk English home">
        <Logo />
      </Link>
      {user ? (
        <>
          <NavLinks user={user} />
          <UserMenu user={user} />
        </>
      ) : (
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">
              <UserRound aria-hidden className="sm:hidden" />
              <span>Log in</span>
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Sign up free</Link>
          </Button>
        </nav>
      )}
    </div>
  </header>
)
