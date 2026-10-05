import type { Metadata } from 'next'

import { AuthCard } from '@/components/auth-card'

export const metadata: Metadata = { title: 'Waiting for approval' }

export default function AwaitingApprovalPage() {
  return (
    <AuthCard title="Waiting for approval">
      <p className="text-sm leading-relaxed">
        Thanks for registering as an educator. Our team checks every educator account before it can see the
        question bank. We will email you as soon as your account is approved, usually within one working day.
      </p>
    </AuthCard>
  )
}
