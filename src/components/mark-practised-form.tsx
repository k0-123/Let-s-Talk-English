'use client'

import { CheckCircle2 } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { markPractisedAction, type ActionState } from '@/app/(frontend)/student-actions'
import { usePracticeSession } from '@/components/speaking/practice-session'
import { SubmitButton } from '@/components/submit-button'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

const LEVELS = [
  { value: 1, label: 'Not yet' },
  { value: 2, label: 'Shaky' },
  { value: 3, label: 'OK' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Confident' },
]

/**
 * On success the server action revalidates the page, which then renders its
 * "practised" state (date + next button), so this form only shows errors.
 */
export const MarkPractisedForm = ({
  setId,
  studentId,
  label,
  askConfidence = false,
}: {
  setId: string
  studentId?: string
  label: string
  askConfidence?: boolean
}) => {
  const [state, action] = useActionState<ActionState, FormData>(markPractisedAction, {})
  const { speakingSeconds } = usePracticeSession()
  const [confidence, setConfidence] = useState<number | null>(null)

  useEffect(() => {
    if (state.success) toast.success(studentId ? 'Marked as covered' : 'Saved to your history')
  }, [state, studentId])

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      <input type="hidden" name="setId" value={setId} />
      {studentId && <input type="hidden" name="studentId" value={studentId} />}
      <input type="hidden" name="speakingSeconds" value={Math.round(speakingSeconds)} />
      {askConfidence && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">How confident did you feel? (optional)</legend>
          <div className="grid grid-cols-5 gap-1.5">
            {LEVELS.map((level) => (
              <label
                key={level.value}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-1 py-2 text-xs font-medium transition-colors',
                  confidence === level.value ? 'border-primary bg-secondary text-secondary-foreground' : 'hover:bg-accent',
                )}
              >
                <input
                  type="radio"
                  name="confidence"
                  value={level.value}
                  checked={confidence === level.value}
                  onChange={() => setConfidence(level.value)}
                  className="sr-only"
                />
                <span className="text-base font-bold tabular-nums">{level.value}</span>
                <span className="text-center leading-tight text-muted-foreground">{level.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <SubmitButton size="lg" className="w-full" pendingText="Saving…">
        <CheckCircle2 aria-hidden />
        {label}
      </SubmitButton>
    </form>
  )
}
