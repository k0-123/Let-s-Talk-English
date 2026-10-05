'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireUser } from '@/lib/auth'
import { joinEducatorWithCode } from '@/lib/educator'
import { getPayloadClient } from '@/lib/payload'
import { PracticeError, recordPractice, startNewCycle } from '@/lib/practice'
import { rateLimit } from '@/lib/rate-limit'

export type ActionState = { error?: string; success?: string }

/** Student marks a set as practised, or an educator marks it as covered for one of their students. */
export async function markPractisedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser(['student', 'educator'])
  const setId = String(formData.get('setId') ?? '')
  const studentId = user.role === 'student' ? user.id : String(formData.get('studentId') ?? '')
  if (!setId || !studentId) return { error: 'Something went wrong. Please reload the page and try again.' }

  const payload = await getPayloadClient()
  try {
    await recordPractice(payload, user, { studentId, setId })
    // The set page re-renders in its "practised" state; lists and history refresh too.
    revalidatePath('/', 'layout')
    return { success: 'Saved.' }
  } catch (error) {
    if (error instanceof PracticeError) return { error: error.message }
    throw error
  }
}

export async function startNewCycleAction(): Promise<void> {
  const student = await requireUser(['student'])
  const payload = await getPayloadClient()
  try {
    await startNewCycle(payload, student)
  } catch (error) {
    if (error instanceof PracticeError) redirect('/history')
    throw error
  }
  revalidatePath('/', 'layout')
  redirect('/practice?newCycle=1')
}

export async function joinEducatorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const student = await requireUser(['student'])
  const limit = rateLimit(`join:${student.id}`, 10, 15 * 60 * 1000)
  if (!limit.ok) return { error: 'Too many attempts. Please wait a few minutes and try again.' }

  const payload = await getPayloadClient()
  try {
    const { educatorName } = await joinEducatorWithCode(payload, student, String(formData.get('code') ?? ''))
    revalidatePath('/', 'layout')
    return { success: `You have joined ${educatorName}. They can now see your practice history.` }
  } catch (error) {
    if (error instanceof PracticeError) return { error: error.message }
    throw error
  }
}
