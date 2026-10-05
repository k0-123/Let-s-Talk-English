'use client'

import { useActionState } from 'react'

import { resetPasswordAction, type FormState } from '@/app/(frontend)/auth-actions'
import { FormField } from '@/components/form-field'
import { SubmitButton } from '@/components/submit-button'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'

export const ResetPasswordForm = ({ token }: { token: string }) => {
  const [state, action] = useActionState<FormState, FormData>(resetPasswordAction, {})
  const errors = state.fieldErrors ?? {}
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      <input type="hidden" name="token" value={token} />
      <FormField id="password" label="New password" error={errors.password} hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </FormField>
      <FormField id="confirmPassword" label="Confirm new password" error={errors.confirmPassword}>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </FormField>
      <SubmitButton className="w-full" size="lg" pendingText="Saving…">
        Save new password
      </SubmitButton>
    </form>
  )
}
