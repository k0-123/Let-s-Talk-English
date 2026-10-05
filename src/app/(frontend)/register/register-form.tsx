'use client'

import { useActionState, useState } from 'react'

import { registerAction, type FormState } from '@/app/(frontend)/auth-actions'
import { FormField } from '@/components/form-field'
import { SubmitButton } from '@/components/submit-button'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const roles = [
  { value: 'student', title: "I'm a student", text: 'Practise question sets and track what you have done.' },
  { value: 'educator', title: "I'm an educator", text: "Follow your students' practice. Needs approval." },
] as const

export const RegisterForm = ({ defaultRole }: { defaultRole: 'student' | 'educator' }) => {
  const [state, action] = useActionState<FormState, FormData>(registerAction, {})
  const [role, setRole] = useState<string>(state.values?.role ?? defaultRole)
  const errors = state.fieldErrors ?? {}

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert variant="destructive">{state.error}</Alert>}

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Account type</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer flex-col gap-1 rounded-md border p-3 text-sm transition-colors',
                role === option.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent',
              )}
            >
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="accent-[var(--primary)]"
                />
                {option.title}
              </span>
              <span className="text-muted-foreground">{option.text}</span>
            </label>
          ))}
        </div>
        {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
      </fieldset>

      <FormField id="name" label="Full name" error={errors.name}>
        <Input id="name" name="name" autoComplete="name" required defaultValue={state.values?.name} />
      </FormField>
      <FormField id="email" label="Email" error={errors.email}>
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
      <FormField id="password" label="Password" error={errors.password} hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </FormField>
      <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </FormField>

      <SubmitButton className="w-full" size="lg" pendingText="Creating your account…">
        Create account
      </SubmitButton>
    </form>
  )
}
