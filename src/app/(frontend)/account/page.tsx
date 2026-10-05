import { ChevronRight, KeyRound, LogOut, Palette, UserRound, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { PageHeader } from '@/components/page-header'
import { ConfirmSubmit } from '@/components/confirm-submit'
import { Avatar } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { getEducatorName } from '@/lib/educator'
import { getPayloadClient } from '@/lib/payload'
import { parseTheme } from '@/lib/theme'

import { PasswordForm, ProfileForm, ThemeForm } from './account-forms'
import { logoutEverywhereAction } from './actions'

export const metadata: Metadata = { title: 'Account' }

const Section = ({ icon: Icon, title, description, children }: { icon: typeof UserRound; title: string; description?: string; children: ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        <Icon className="size-4 text-primary" aria-hidden /> {title}
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
)

export default async function AccountPage() {
  const user = await requireUser()
  const payload = await getPayloadClient()
  const educatorName = user.role === 'student' ? await getEducatorName(payload, user) : null

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Account" />
      <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <Avatar name={user.name} className="size-14 text-lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Section icon={UserRound} title="Profile">
        <ProfileForm name={user.name} weeklyGoal={user.role === 'student' ? (user.weeklyGoal ?? 5) : undefined} />
      </Section>

      {user.role === 'student' && (
        <Link href="/join" className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary">
          <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <Users className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-medium">My educator</span>
            <span className="text-sm text-muted-foreground">{educatorName ?? 'Not linked yet: join with an invite code'}</span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
      )}

      <Section icon={Palette} title="Appearance">
        <ThemeForm theme={parseTheme(user.theme)} />
      </Section>

      <Section icon={KeyRound} title="Password">
        <PasswordForm />
      </Section>

      <Section icon={LogOut} title="Sessions" description="Lost a phone, or used a shared computer? Log out everywhere.">
        <form action={logoutEverywhereAction}>
          <ConfirmSubmit variant="outline" message="Log out on every device, including this one?" pendingText="Logging out…">
            Log out on all devices
          </ConfirmSubmit>
        </form>
      </Section>
    </div>
  )
}
