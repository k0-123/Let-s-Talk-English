'use client'

import { CheckCircle2 } from 'lucide-react'
import { useActionState } from 'react'

import { markPractisedAction, type ActionState } from '@/app/(frontend)/student-actions'
import { SubmitButton } from '@/components/submit-button'
import { Alert } from '@/components/ui/alert'

/**
 * On success the server action revalidates the page, which then renders its
 * "practised" state (date + next button), so this form only shows errors.
 */
export const MarkPractisedForm = ({
  setId,
  studentId,
  label,
}: {
  setId: string
  studentId?: string
  label: string
}) => {
  const [state, action] = useActionState<ActionState, FormData>(markPractisedAction, {})

  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      <input type="hidden" name="setId" value={setId} />
      {studentId && <input type="hidden" name="studentId" value={studentId} />}
      <SubmitButton size="lg" className="w-full" pendingText="Saving…">
        <CheckCircle2 aria-hidden />
        {label}
      </SubmitButton>
    </form>
  )
}
