'use server'

import { revalidatePath } from 'next/cache'

import { requireUser } from '@/lib/auth'
import { regenerateInviteCode } from '@/lib/educator'
import { getPayloadClient } from '@/lib/payload'
import { PracticeError, recordPractice } from '@/lib/practice'

export async function regenerateCodeAction(): Promise<void> {
  const educator = await requireUser(['educator'])
  const payload = await getPayloadClient()
  await regenerateInviteCode(payload, educator)
  revalidatePath('/educator')
}

/** Inline "mark as covered" from the student's not-done list. */
export async function markCoveredAction(formData: FormData): Promise<void> {
  const educator = await requireUser(['educator'])
  const studentId = String(formData.get('studentId') ?? '')
  const setId = String(formData.get('setId') ?? '')
  const payload = await getPayloadClient()
  try {
    await recordPractice(payload, educator, { studentId, setId })
  } catch (error) {
    // Not their student or set gone: nothing to record, the page reloads unchanged.
    if (!(error instanceof PracticeError)) throw error
  }
  revalidatePath(`/educator/students/${studentId}`)
  revalidatePath('/educator')
}
