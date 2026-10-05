import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'

import { useAssignments, useRemoveAssignment } from '@/api/hooks'
import { QueryState } from '@/components/layout'
import { AssignmentRow } from '@/components/rows'
import { Button, EmptyState, Muted, Screen, Segmented, Title } from '@/components/ui'
import { confirm } from '@/lib/device'
import type { Assignment } from '@/lib/types'

type Filter = 'open' | 'overdue' | 'done'

const matches: Record<Filter, (a: Assignment) => boolean> = {
  open: (a) => !a.done && !a.overdue,
  overdue: (a) => !a.done && a.overdue,
  done: (a) => a.done,
}

export default function Assignments() {
  const query = useAssignments()
  const remove = useRemoveAssignment()
  const [filter, setFilter] = useState<Filter>('open')
  if (!query.data) return <QueryState isPending={query.isPending} error={query.error} onRetry={() => query.refetch()} />

  const all = query.data.assignments
  const count = (f: Filter) => all.filter(matches[f]).length
  const shown = all.filter(matches[filter])

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Title>Assignments</Title>
      <Muted>Assign sets from a student’s “Not done yet” tab. They are done when the student practises them.</Muted>
      <Segmented<Filter>
        options={[
          { value: 'open', label: `To do (${count('open')})` },
          { value: 'overdue', label: `Overdue (${count('overdue')})` },
          { value: 'done', label: `Done (${count('done')})` },
        ]}
        value={filter}
        onChange={setFilter}
      />
      {shown.length === 0 ? (
        <EmptyState
          icon="clipboard-outline"
          title={all.length ? 'Nothing in this list' : 'No assignments yet'}
          message={all.length ? undefined : 'Open a student and choose sets from “Not done yet” to assign them.'}
        />
      ) : (
        shown.map((a) => (
          <View key={a.id} style={{ gap: 4 }}>
            <AssignmentRow assignment={a} showStudent onPress={() => a.studentId && router.push({ pathname: '/student/[id]', params: { id: a.studentId } })} />
            {!a.done && (
              <Button
                title="Remove"
                variant="ghost"
                size="sm"
                icon="trash-outline"
                style={{ alignSelf: 'flex-end' }}
                onPress={async () => {
                  if (await confirm('Remove this assignment?', `${a.topic ?? 'This set'} will no longer be assigned to ${a.studentName ?? 'the student'}.`, 'Remove', true)) {
                    remove.mutate(a.id)
                  }
                }}
              />
            )}
          </View>
        ))
      )}
    </Screen>
  )
}
