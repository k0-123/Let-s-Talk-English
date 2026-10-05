'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  dailyLimit,
  feedbackUsedToday,
  getAnswerFeedback,
  listFeedback,
  type FeedbackView,
} from '@/lib/ai-feedback'
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
    await recordPractice(payload, user, {
      studentId,
      setId,
      confidence: Number(formData.get('confidence')) || null,
      speakingSeconds: Number(formData.get('speakingSeconds')) || null,
    })
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

export type FeedbackActionResult = { error?: string; feedback?: FeedbackView; usedToday?: number; limit?: number }

/** Student asks Claude for feedback on one answer. */
export async function getFeedbackAction(input: {
  setId: string
  questionIndex: number
  answerText: string
}): Promise<FeedbackActionResult> {
  const student = await requireUser(['student'])
  if (!rateLimit(`ai:${student.id}`, 6, 60 * 1000).ok) {
    return { error: 'Please wait a moment before asking again.' }
  }
  const payload = await getPayloadClient()
  try {
    const row = await getAnswerFeedback(payload, student, input)
    const [feedback] = await listFeedback(payload, student, { studentId: student.id, setId: input.setId, limit: 1 })
    revalidatePath('/history/feedback')
    return {
      feedback: feedback ?? undefined,
      usedToday: await feedbackUsedToday(payload, student.id),
      limit: dailyLimit(),
      ...(feedback ? {} : { error: row ? undefined : 'Feedback could not be saved.' }),
    }
  } catch (error) {
    if (error instanceof PracticeError) return { error: error.message }
    throw error
  }
}
