'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { loginAction, resendVerificationAction, type FormState } from '@/app/(frontend)/auth-actions'
import { FormField } from '@/components/form-field'
import { SubmitButton } from '@/components/submit-button'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'

const ResendConfirmation = ({ email }: { email: string }) => {
  const [state, action] = useActionState<FormState, FormData>(resendVerificationAction, {})
  if (state.success) return <Alert variant="success">{state.success}</Alert>
  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      <SubmitButton variant="outline" className="w-full" pendingText="Sending…">
        Send the confirmation email again
      </SubmitButton>
    </form>
  )
}

export const LoginForm = ({ next }: { next?: string }) => {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {})
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4" noValidate>
        {state.error && <Alert variant="destructive">{state.error}</Alert>}
        {next && <input type="hidden" name="next" value={next} />}
        <FormField id="email" label="Email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={state.values?.email}
          />
        </FormField>
        <FormField id="password" label="Password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </FormField>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot your password?
          </Link>
        </div>
        <SubmitButton className="w-full" size="lg" pendingText="Logging in…">
          Log in
        </SubmitButton>
      </form>
      {state.unverifiedEmail && <ResendConfirmation email={state.unverifiedEmail} />}
    </div>
  )
}
