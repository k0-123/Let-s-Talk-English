import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard } from '@/components/auth-card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Check your email' }

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams
  return (
    <AuthCard title="Check your email" description="Your account has been created.">
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          We have sent you an email with a link to confirm your address. Open it on this device to activate
          your account. If you cannot find it, check your spam or promotions folder.
        </p>
        {role === 'educator' && (
          <p>
            Educator accounts are also checked by our team. After you confirm your email, we will review your
            account and email you as soon as it is approved.
          </p>
        )}
        <Button asChild variant="outline" className="w-full">
          <Link href="/verify-email">Didn&apos;t get the email?</Link>
        </Button>
      </div>
    </AuthCard>
  )
}
