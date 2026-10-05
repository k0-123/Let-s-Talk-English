'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { addNoteAction, type EducatorActionState } from '@/app/(frontend)/educator/actions'
import { SubmitButton } from '@/components/submit-button'

export const NoteForm = ({ studentId }: { studentId: string }) => {
  const [state, action] = useActionState<EducatorActionState, FormData>(addNoteAction, {})
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.success) {
      toast.success(state.success)
      formRef.current?.reset()
    }
    if (state.error) toast.error(state.error)
  }, [state])
  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="studentId" value={studentId} />
      <label className="block text-sm font-medium" htmlFor="note-body">
        Add a private note
      </label>
      <textarea
        id="note-body"
        name="body"
        required
        maxLength={2000}
        rows={3}
        placeholder="What did you notice in today's session?"
        className="w-full rounded-lg border border-input bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <SubmitButton size="sm" pendingText="Saving…">
        Save note
      </SubmitButton>
    </form>
  )
}
