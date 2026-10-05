'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { isActive, navFor } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import type { User } from '@/payload-types'

type Role = Pick<User, 'role' | 'approved'>

/** Desktop navigation in the header. */
export const NavLinks = ({ user }: { user: Role }) => {
  const pathname = usePathname()
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
      {navFor(user).map((item) => {
        const active = isActive(pathname, item)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Bottom tab bar on phones. */
export const MobileTabBar = ({ user }: { user: Role }) => {
  const pathname = usePathname()
  const items = navFor(user)
  if (items.length === 0) return null
  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:hidden"
    >
      <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActive(pathname, item)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <span className={cn('rounded-full px-4 py-1 transition-colors', active && 'bg-secondary')}>
                  <item.icon className="size-5" aria-hidden />
                </span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
