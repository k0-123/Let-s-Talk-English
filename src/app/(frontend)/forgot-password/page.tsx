import type { Metadata } from 'next'
import Link from 'next/link'

import { forgotPasswordAction } from '@/app/(frontend)/auth-actions'
import { AuthCard } from '@/components/auth-card'
import { EmailOnlyForm } from '@/components/email-only-form'

export const metadata: Metadata = { title: 'Forgot your password?' }

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we will send you a link to choose a new password."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      <EmailOnlyForm action={forgotPasswordAction} submitLabel="Send reset link" />
    </AuthCard>
  )
}
