import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthCard } from '@/components/auth-card'
import { Alert } from '@/components/ui/alert'
import { getCurrentUser, homePathFor, safeNextPath } from '@/lib/auth'

import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; verified?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  if (user) redirect(homePathFor(user))

  return (
    <AuthCard
      title="Log in"
      description="Welcome back. Log in to continue practising."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {params.reset && <Alert variant="success">Your password has been changed. You can log in now.</Alert>}
        {params.verified && <Alert variant="success">Your email is confirmed. You can log in now.</Alert>}
        <LoginForm next={safeNextPath(params.next) ?? undefined} />
      </div>
    </AuthCard>
  )
}
