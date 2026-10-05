import type { Metadata } from 'next'

import { FeedbackList } from '@/components/feedback-list'
import { HistoryTabs } from '@/components/history-tabs'
import { PageHeader } from '@/components/page-header'
import { dailyLimit, feedbackUsedToday, isAiFeedbackEnabled, listFeedback } from '@/lib/ai-feedback'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'AI feedback' }

export default async function FeedbackHistoryPage() {
  const student = await requireUser(['student'])
  const payload = await getPayloadClient()
  const items = await listFeedback(payload, student, { studentId: student.id, limit: 50 })
  const enabled = isAiFeedbackEnabled()
  const used = enabled ? await feedbackUsedToday(payload, student.id) : 0

  return (
    <div>
      <PageHeader
        title="My history"
        description={enabled ? `${Math.max(0, dailyLimit() - used)} of ${dailyLimit()} feedback requests left today.` : undefined}
      />
      <HistoryTabs active="feedback" />
      <FeedbackList
        items={items}
        emptyText={
          enabled
            ? 'Open any set, record or type your answer, and tap "Get AI feedback".'
            : 'AI feedback is not switched on for this site yet.'
        }
      />
    </div>
  )
}
