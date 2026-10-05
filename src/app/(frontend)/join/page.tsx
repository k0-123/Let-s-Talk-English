import type { Metadata } from 'next'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { getEducatorName } from '@/lib/educator'
import { getPayloadClient } from '@/lib/payload'

import { JoinForm } from './join-form'

export const metadata: Metadata = { title: 'My educator' }

export default async function JoinPage() {
  const student = await requireUser(['student'])
  const payload = await getPayloadClient()
  const educatorName = await getEducatorName(payload, student)

  return (
    <div className="space-y-6">
      <PageHeader
        title="My educator"
        description="Your educator can see which sets you have practised and when, so they do not repeat questions in class."
      />
      {educatorName ? (
        <Card>
          <CardHeader>
            <CardDescription>You are linked to</CardDescription>
            <CardTitle className="text-2xl">{educatorName}</CardTitle>
          </CardHeader>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{educatorName ? 'Changing educator?' : 'Join your educator'}</CardTitle>
          <CardDescription>
            {educatorName
              ? 'Enter the invite code from your new educator. You can only have one educator at a time, and your history moves with you.'
              : 'Ask your educator for their invite code and enter it here.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinForm submitLabel={educatorName ? 'Switch educator' : 'Join'} />
        </CardContent>
      </Card>
    </div>
  )
}
