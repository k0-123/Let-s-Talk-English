'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import { FormField } from '@/components/form-field'
import { ThemeToggle } from '@/components/shell/theme-toggle'
import { SubmitButton } from '@/components/submit-button'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import type { ThemePreference } from '@/lib/theme'

import { changePasswordAction, saveThemeAction, updateProfileAction, type AccountState } from './actions'

const useToastOnSuccess = (state: AccountState) => {
  useEffect(() => {
    if (state.success) toast.success(state.success)
  }, [state])
}

export const ProfileForm = ({ name, weeklyGoal }: { name: string; weeklyGoal?: number }) => {
  const [state, action] = useActionState<AccountState, FormData>(updateProfileAction, {})
  useToastOnSuccess(state)
  const errors = state.fieldErrors ?? {}
  return (
    <form action={action} className="space-y-4">
      <FormField id="name" label="Name" error={errors.name}>
        <Input id="name" name="name" defaultValue={name} autoComplete="name" required />
      </FormField>
      {weeklyGoal !== undefined && (
        <FormField id="weeklyGoal" label="Weekly goal" error={errors.weeklyGoal} hint="How many sets you aim to practise each week.">
          <Input id="weeklyGoal" name="weeklyGoal" type="number" min={1} max={50} defaultValue={weeklyGoal} inputMode="numeric" className="max-w-32" />
        </FormField>
      )}
      <SubmitButton pendingText="Saving…">Save</SubmitButton>
    </form>
  )
}

export const ThemeForm = ({ theme }: { theme: ThemePreference }) => (
  <ThemeToggle
    initial={theme}
    onChange={(value) => {
      void saveThemeAction(value).catch(() => toast.error('Could not save your theme.'))
    }}
  />
)

export const PasswordForm = () => {
  const [state, action] = useActionState<AccountState, FormData>(changePasswordAction, {})
  useToastOnSuccess(state)
  const errors = state.fieldErrors ?? {}
  return (
    <form action={action} className="space-y-4" key={state.success ? 'done' : 'form'}>
      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      <FormField id="currentPassword" label="Current password" error={errors.currentPassword}>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="password" label="New password" error={errors.password} hint="At least 8 characters.">
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </FormField>
        <FormField id="confirmPassword" label="Confirm new password" error={errors.confirmPassword}>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        </FormField>
      </div>
      <SubmitButton variant="outline" pendingText="Changing…">Change password</SubmitButton>
    </form>
  )
}
