import { getCurrentUser } from '@/lib/auth'
import { dayKey } from '@/lib/dates'
import { canExportAll, csvResponse, practiceLogCsv } from '@/lib/exports'
import { getPayloadClient } from '@/lib/payload'

/** Admin: every practice log as CSV. */
export async function GET(): Promise<Response> {
  const user = await getCurrentUser()
  if (!user) return new Response('Please log in.', { status: 401 })
  if (!canExportAll(user)) return new Response('Admins only.', { status: 403 })
  const payload = await getPayloadClient()
  return csvResponse(await practiceLogCsv(payload, user), `practice-logs-${dayKey(new Date())}.csv`)
}
