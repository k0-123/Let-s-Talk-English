'use client'

import { useActionState } from 'react'

import type { FormState } from '@/app/(frontend)/auth-actions'
import { FormField } from '@/components/form-field'
import { SubmitButton } from '@/components/submit-button'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'

/** A one-field email form used by "forgot password" and "resend confirmation". */
export const EmailOnlyForm = ({
  action,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  submitLabel: string
}) => {
  const [state, formAction] = useActionState<FormState, FormData>(action, {})
  if (state.success) return <Alert variant="success">{state.success}</Alert>
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      <FormField id="email" label="Email" error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
        />
      </FormField>
      <SubmitButton className="w-full" pendingText="Sending…">
        {submitLabel}
      </SubmitButton>
    </form>
  )
}
