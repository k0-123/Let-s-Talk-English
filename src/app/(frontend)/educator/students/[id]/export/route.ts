import { isApprovedEducator } from '@/access'
import { getCurrentUser } from '@/lib/auth'
import { dayKey } from '@/lib/dates'
import { getOwnStudent } from '@/lib/educator'
import { csvResponse, practiceLogCsv } from '@/lib/exports'
import { getPayloadClient } from '@/lib/payload'
import { slugify } from '@/lib/slugify'

/** CSV of one student's full practice history (own students only). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const user = await getCurrentUser()
  if (!user) return new Response('Please log in.', { status: 401 })
  if (!isApprovedEducator(user)) return new Response('Educators only.', { status: 403 })
  const payload = await getPayloadClient()
  const student = await getOwnStudent(payload, user, (await params).id)
  if (!student) return new Response('Student not found.', { status: 404 })
  return csvResponse(await practiceLogCsv(payload, user, { studentId: student.id }), `${slugify(student.name)}-history-${dayKey(new Date())}.csv`)
}
