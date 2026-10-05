import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthCard } from '@/components/auth-card'
import { getCurrentUser, homePathFor } from '@/lib/auth'

import { RegisterForm } from './register-form'

export const metadata: Metadata = { title: 'Create an account' }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const user = await getCurrentUser()
  if (user) redirect(homePathFor(user))
  const { role } = await searchParams

  return (
    <AuthCard
      title="Create an account"
      description="It's free. We'll send you an email to confirm your address."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm defaultRole={role === 'educator' ? 'educator' : 'student'} />
    </AuthCard>
  )
}
