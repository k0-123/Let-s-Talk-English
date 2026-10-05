import { Activity, AlertTriangle, Download, Target, Users } from 'lucide-react'
import type { Metadata } from 'next'

import { InviteCodeCard } from '@/components/educator/invite-code-card'
import { StudentTable } from '@/components/educator/student-table'
import { OnboardingChecklist } from '@/components/onboarding-checklist'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { StatCard } from '@/components/ui/stat-card'
import { listAssignments } from '@/lib/assignments'
import { requireUser } from '@/lib/auth'
import { listStudentSummaries } from '@/lib/educator'
import { getPayloadClient } from '@/lib/payload'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'My students' }

export default async function EducatorDashboard() {
  const educator = await requireUser(['educator'])
  const payload = await getPayloadClient()
  const [students, assignments] = await Promise.all([listStudentSummaries(payload, educator), listAssignments(payload, educator)])

  const activeThisWeek = students.filter((s) => s.weekly[s.weekly.length - 1] > 0).length
  const setsThisWeek = students.reduce((sum, s) => sum + (s.weekly[s.weekly.length - 1] ?? 0), 0)
  const needAttention = students.filter((s) => s.status === 'slipping' || s.status === 'inactive').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="My students"
        description="See who is practising, what they have covered, and who needs a nudge."
        actions={
          students.length > 0 ? (
            <Button asChild variant="outline" size="sm">
              <a href="/educator/export" download>
                <Download aria-hidden /> Export CSV
              </a>
            </Button>
          ) : null
        }
      />

      {!educator.onboardingDismissed && (
        <OnboardingChecklist
          title="Getting started"
          steps={[
            { label: 'Your account is approved', done: true },
            { label: 'Share your invite code with your students', done: students.length > 0 },
            { label: 'Your first student joins', done: students.length > 0 },
            { label: 'Assign a set to a student', done: assignments.length > 0, href: students[0] ? `/educator/students/${students[0].id}?tab=todo` : undefined },
          ]}
        />
      )}

      <InviteCodeCard code={educator.inviteCode ?? ''} />

      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet">
          Share your invite code. Students who join you appear here with their progress.
        </EmptyState>
      ) : (
        <>
          <section aria-label="Class overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Users} label="Students" value={students.length} />
            <StatCard icon={Activity} tone="success" label="Practised this week" value={activeThisWeek} hint={`of ${students.length}`} />
            <StatCard icon={Target} label="Sets this week" value={setsThisWeek} />
            <StatCard icon={AlertTriangle} tone="warning" label="Need a nudge" value={needAttention} hint="Slipping or inactive" />
          </section>
          <StudentTable students={students.map((s) => ({ ...s, lastActiveLabel: formatDate(s.lastActive) }))} />
        </>
      )}
    </div>
  )
}
