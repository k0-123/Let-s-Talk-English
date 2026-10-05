import { ChevronRight, RefreshCw } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { ConfirmSubmit } from '@/components/confirm-submit'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { listStudentSummaries } from '@/lib/educator'
import { getPayloadClient } from '@/lib/payload'
import { formatDate, plural } from '@/lib/utils'

import { regenerateCodeAction } from './actions'

export const metadata: Metadata = { title: 'My students' }

export default async function EducatorDashboard() {
  const educator = await requireUser(['educator'])
  const payload = await getPayloadClient()
  const students = await listStudentSummaries(payload, educator)

  return (
    <div className="space-y-6">
      <PageHeader title="My students" description="See what each student has practised and when." />

      <Card>
        <CardHeader>
          <CardTitle>Your invite code</CardTitle>
          <CardDescription>
            Students enter this code on their &quot;My educator&quot; page to join you.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-3xl font-bold tracking-[0.3em]" data-testid="invite-code">
            {educator.inviteCode}
          </p>
          <form action={regenerateCodeAction}>
            <ConfirmSubmit
              variant="outline"
              size="sm"
              pendingText="Creating…"
              message="Create a new code? The old code stops working. Students who already joined stay linked."
            >
              <RefreshCw aria-hidden />
              New code
            </ConfirmSubmit>
          </form>
        </CardContent>
      </Card>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No students yet. Share your invite code with your students to get started.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{plural(students.length, 'student')}</CardTitle>
          </CardHeader>
          {/* Phones get stacked rows; wider screens get a table. */}
          <ul className="divide-y sm:hidden">
            {students.map((s) => (
              <li key={s.id}>
                <Link href={`/educator/students/${s.id}`} className="flex items-center gap-3 p-4 hover:bg-accent">
                  <div className="flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {plural(s.setsThisCycle, 'set')} · last active {formatDate(s.lastActive)}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-y bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-3 py-3 text-right">Sets completed</th>
                  <th className="px-3 py-3 text-right">All time</th>
                  <th className="px-6 py-3 text-right">Last active</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-accent/50">
                    <td className="px-6 py-3">
                      <Link href={`/educator/students/${s.id}`} className="font-medium hover:text-primary hover:underline">
                        {s.name}
                      </Link>
                      <div className="text-muted-foreground">{s.email}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      {s.setsThisCycle}
                      {s.cycle > 1 && <span className="block text-xs text-muted-foreground">cycle {s.cycle}</span>}
                    </td>
                    <td className="px-3 py-3 text-right">{s.setsAllTime}</td>
                    <td className="px-6 py-3 text-right">{formatDate(s.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
