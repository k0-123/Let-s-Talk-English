'use client'

import { CheckCircle2, ClipboardPlus } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { assignSetsAction, markCoveredAction, type EducatorActionState } from '@/app/(frontend)/educator/actions'
import { SubmitButton } from '@/components/submit-button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { SetSummary } from '@/lib/practice'
import { plural } from '@/lib/utils'

/**
 * The "not done yet" list. Tick sets to assign them (with an optional due date
 * and note), or mark one as covered in a live session.
 */
export const AssignForm = ({
  studentId,
  studentName,
  sets,
  categoryNames,
  assignedSetIds,
}: {
  studentId: string
  studentName: string
  sets: SetSummary[]
  categoryNames: Record<string, string>
  assignedSetIds: string[]
}) => {
  const [selected, setSelected] = useState<string[]>([])
  const [state, action] = useActionState<EducatorActionState, FormData>(async (prev, formData) => {
    const result = await assignSetsAction(prev, formData)
    if (result.success) setSelected([])
    return result
  }, {})
  const assigned = new Set(assignedSetIds)

  useEffect(() => {
    if (state.success) toast.success(state.success)
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <>
    {sets.map((set) => (
      <form key={set.id} id={`cover-${set.id}`} action={markCoveredAction} hidden>
        <input type="hidden" name="studentId" value={studentId} />
        <input type="hidden" name="setId" value={set.id} />
      </form>
    ))}
    <form action={action}>
      <input type="hidden" name="studentId" value={studentId} />
      <ul className="divide-y rounded-xl border bg-card shadow-sm">
        {sets.map((set) => (
          <li key={set.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <label className="flex flex-1 items-start gap-3">
              <input
                type="checkbox"
                name="setIds"
                value={set.id}
                checked={selected.includes(set.id)}
                disabled={assigned.has(set.id)}
                onChange={(e) => setSelected((s) => (e.target.checked ? [...s, set.id] : s.filter((id) => id !== set.id)))}
                className="mt-1 size-4 accent-[var(--primary)]"
                aria-label={`Select ${set.topic}`}
              />
              <span className="min-w-0">
                <Link href={`/sets/${set.id}?student=${studentId}`} className="font-medium hover:text-primary hover:underline">
                  {set.topic}
                </Link>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {set.categoryId && categoryNames[set.categoryId] && <Badge variant="secondary">{categoryNames[set.categoryId]}</Badge>}
                  {plural(set.questionCount, 'question')}
                  {assigned.has(set.id) && <Badge variant="outline">Assigned</Badge>}
                </span>
              </span>
            </label>
            {/* Submits its own small form (rendered below): forms cannot be nested. */}
            <button
              type="submit"
              form={`cover-${set.id}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-accent"
            >
              <CheckCircle2 className="size-4" aria-hidden /> Mark as covered
            </button>
          </li>
        ))}
      </ul>

      <div
        className={`sticky bottom-20 z-30 mt-4 rounded-xl border bg-card p-4 shadow-lg transition-opacity sm:bottom-4 ${selected.length ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!selected.length}
      >
        <p className="mb-3 text-sm font-medium">
          Assign {plural(selected.length, 'set')} to {studentName}
        </p>
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
          <label className="text-xs font-medium text-muted-foreground">
            Due date (optional)
            <Input type="date" name="dueDate" className="mt-1" />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Note for the student (optional)
            <Input name="note" maxLength={500} placeholder="e.g. Focus on giving reasons" className="mt-1" />
          </label>
          <SubmitButton pendingText="Assigning…">
            <ClipboardPlus aria-hidden /> Assign
          </SubmitButton>
        </div>
      </div>
    </form>
    </>
  )
}
