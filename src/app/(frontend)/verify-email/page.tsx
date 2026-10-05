import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { resendVerificationAction } from '@/app/(frontend)/auth-actions'
import { AuthCard } from '@/components/auth-card'
import { EmailOnlyForm } from '@/components/email-only-form'
import { Alert } from '@/components/ui/alert'
import { getPayloadClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Confirm your email' }

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams

  if (token) {
    const payload = await getPayloadClient()
    const verified = await payload
      .verifyEmail({ collection: 'users', token })
      .catch(() => false)
    if (verified) redirect('/login?verified=1')
  }

  return (
    <AuthCard
      title="Confirm your email"
      description="Enter your email and we will send you a new confirmation link."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      <div className="space-y-4">
        {token && (
          <Alert variant="destructive">
            This confirmation link is invalid or has already been used. If you have already confirmed your
            email, just log in.
          </Alert>
        )}
        <EmailOnlyForm action={resendVerificationAction} submitLabel="Send a new link" />
      </div>
    </AuthCard>
  )
}
