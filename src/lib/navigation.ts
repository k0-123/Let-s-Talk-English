import {
  BookOpen,
  ClipboardList,
  History,
  LayoutDashboard,
  Shield,
  Upload,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'

import type { User } from '@/payload-types'

export type NavItem = { href: string; label: string; icon: LucideIcon; match?: string[] }

/** Main navigation per role, shared by the desktop header and the phone tab bar. */
export const navFor = (user: Pick<User, 'role' | 'approved'> | null): NavItem[] => {
  if (!user) return []
  if (user.role === 'student') {
    return [
      { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
      { href: '/practice', label: 'Practice', icon: BookOpen, match: ['/practice', '/sets'] },
      { href: '/history', label: 'History', icon: History },
      { href: '/account', label: 'Me', icon: UserRound, match: ['/account', '/join'] },
    ]
  }
  if (user.role === 'educator' && user.approved) {
    return [
      { href: '/educator', label: 'Students', icon: Users, match: ['/educator/students', '/sets'] },
      { href: '/educator/assignments', label: 'Assignments', icon: ClipboardList },
      { href: '/account', label: 'Me', icon: UserRound },
    ]
  }
  if (user.role === 'admin') {
    return [
      { href: '/admin', label: 'Admin panel', icon: Shield },
      { href: '/import', label: 'Bulk import', icon: Upload },
      { href: '/account', label: 'Me', icon: UserRound },
    ]
  }
  return []
}

export const isActive = (pathname: string, item: NavItem): boolean => {
  const prefixes = item.match ?? [item.href]
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)) || pathname === item.href
}
