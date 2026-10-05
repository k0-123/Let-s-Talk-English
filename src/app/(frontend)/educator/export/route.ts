import { isApprovedEducator } from '@/access'
import { getCurrentUser } from '@/lib/auth'
import { dayKey } from '@/lib/dates'
import { csvResponse, studentSummaryCsv } from '@/lib/exports'
import { getPayloadClient } from '@/lib/payload'

/** CSV of the educator's students and their progress. */
export async function GET(): Promise<Response> {
  const user = await getCurrentUser()
  if (!user) return new Response('Please log in.', { status: 401 })
  if (!isApprovedEducator(user)) return new Response('Educators only.', { status: 403 })
  const payload = await getPayloadClient()
  return csvResponse(await studentSummaryCsv(payload, user), `students-${dayKey(new Date())}.csv`)
}
