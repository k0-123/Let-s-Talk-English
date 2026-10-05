import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard } from '@/components/auth-card'
import { Alert } from '@/components/ui/alert'

import { ResetPasswordForm } from './reset-form'

export const metadata: Metadata = { title: 'Choose a new password' }

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return (
    <AuthCard
      title="Choose a new password"
      footer={
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Request a new link
        </Link>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert variant="destructive">This reset link is incomplete. Please request a new one.</Alert>
      )}
    </AuthCard>
  )
}
