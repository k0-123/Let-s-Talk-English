'use server'

import { revalidatePath } from 'next/cache'

import { assignSets, removeAssignment } from '@/lib/assignments'
import { requireUser } from '@/lib/auth'
import { regenerateInviteCode } from '@/lib/educator'
import { addNote, deleteNote } from '@/lib/notes'
import { getPayloadClient } from '@/lib/payload'
import { PracticeError, recordPractice } from '@/lib/practice'

export type EducatorActionState = { error?: string; success?: string }

const refresh = (studentId?: string) => {
  if (studentId) revalidatePath(`/educator/students/${studentId}`)
  revalidatePath('/educator')
  revalidatePath('/educator/assignments')
}

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
  refresh(studentId)
}

export async function assignSetsAction(_prev: EducatorActionState, formData: FormData): Promise<EducatorActionState> {
  const educator = await requireUser(['educator'])
  const studentId = String(formData.get('studentId') ?? '')
  const setIds = formData.getAll('setIds').map(String)
  const dueDate = String(formData.get('dueDate') ?? '') || null
  const payload = await getPayloadClient()
  try {
    const { created, skipped } = await assignSets(payload, educator, {
      studentId,
      setIds,
      note: String(formData.get('note') ?? ''),
      dueDate: dueDate ? new Date(`${dueDate}T12:00:00Z`).toISOString() : null,
    })
    refresh(studentId)
    return {
      success: `${created} ${created === 1 ? 'set' : 'sets'} assigned${skipped ? ` (${skipped} already assigned)` : ''}.`,
    }
  } catch (error) {
    if (error instanceof PracticeError) return { error: error.message }
    throw error
  }
}

export async function removeAssignmentAction(formData: FormData): Promise<void> {
  const educator = await requireUser(['educator'])
  const payload = await getPayloadClient()
  try {
    await removeAssignment(payload, educator, String(formData.get('assignmentId') ?? ''))
  } catch (error) {
    if (!(error instanceof PracticeError)) throw error
  }
  refresh(String(formData.get('studentId') ?? '') || undefined)
}

export async function addNoteAction(_prev: EducatorActionState, formData: FormData): Promise<EducatorActionState> {
  const educator = await requireUser(['educator'])
  const studentId = String(formData.get('studentId') ?? '')
  const payload = await getPayloadClient()
  try {
    await addNote(payload, educator, { studentId, body: String(formData.get('body') ?? '') })
    refresh(studentId)
    return { success: 'Note saved.' }
  } catch (error) {
    if (error instanceof PracticeError) return { error: error.message }
    throw error
  }
}

export async function deleteNoteAction(formData: FormData): Promise<void> {
  const educator = await requireUser(['educator'])
  const payload = await getPayloadClient()
  try {
    await deleteNote(payload, educator, String(formData.get('noteId') ?? ''))
  } catch (error) {
    if (!(error instanceof PracticeError)) throw error
  }
  refresh(String(formData.get('studentId') ?? '') || undefined)
}
