'use client'

import { useActionState } from 'react'

import { joinEducatorAction, type ActionState } from '@/app/(frontend)/student-actions'
import { FormField } from '@/components/form-field'
import { SubmitButton } from '@/components/submit-button'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'

export const JoinForm = ({ submitLabel }: { submitLabel: string }) => {
  const [state, action] = useActionState<ActionState, FormData>(joinEducatorAction, {})
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <FormField id="code" label="Invite code" hint="Six letters and numbers, e.g. K7P2QX.">
        <Input
          id="code"
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          className="font-mono text-lg uppercase tracking-widest"
        />
      </FormField>
      <SubmitButton className="w-full sm:w-auto" pendingText="Checking…">
        {submitLabel}
      </SubmitButton>
    </form>
  )
}
