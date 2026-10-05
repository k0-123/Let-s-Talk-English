import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { View } from 'react-native'

import { useStudents } from '@/api/hooks'
import { Sparkline } from '@/components/charts'
import { InviteCodeCard } from '@/components/InviteCodeCard'
import { QueryState } from '@/components/layout'
import { StatusBadge } from '@/components/StatusBadge'
import { Avatar, Body, EmptyState, ListRow, Muted, Row, Screen, Segmented, StatTile, TextField, Title } from '@/components/ui'
import { formatDate, plural } from '@/lib/format'
import type { StudentSummary } from '@/lib/types'

type Sort = 'recent' | 'name' | 'sets'

const sorters: Record<Sort, (a: StudentSummary, b: StudentSummary) => number> = {
  recent: (a, b) => (b.lastActive ?? '').localeCompare(a.lastActive ?? ''),
  name: (a, b) => a.name.localeCompare(b.name),
  sets: (a, b) => b.setsThisCycle - a.setsThisCycle,
}

export default function Students() {
  const query = useStudents()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<Sort>('recent')

  const students = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (query.data?.students ?? [])
      .filter((s) => !term || s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term))
      .sort(sorters[sort])
  }, [query.data, search, sort])

  if (!query.data) return <QueryState isPending={query.isPending} error={query.error} onRetry={() => query.refetch()} />

  const all = query.data.students
  const active = all.filter((s) => s.status === 'active').length
  const needNudge = all.filter((s) => s.status === 'slipping' || s.status === 'inactive').length
  const thisWeek = all.reduce((sum, s) => sum + (s.weekly[s.weekly.length - 1] ?? 0), 0)

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <View style={{ gap: 2 }}>
        <Title>Your students</Title>
        <Muted>{plural(all.length, 'student')}</Muted>
      </View>

      {all.length === 0 ? (
        <>
          <EmptyState icon="people-outline" title="No students yet" message="Share your invite code. Students who enter it appear here." />
          <InviteCodeCard code={query.data.inviteCode} />
        </>
      ) : (
        <>
          <Row style={{ alignItems: 'stretch' }} gap={10}>
            <StatTile compact icon="pulse" tone="success" label="Active this week" value={active} />
            <StatTile compact icon="checkmark-done" label="Sets this week" value={thisWeek} />
            <StatTile compact icon="notifications-outline" tone="streak" label="Need a nudge" value={needNudge} />
          </Row>

          <TextField label="Search" placeholder="Name or email" value={search} onChangeText={setSearch} autoCapitalize="none" testID="student-search" />
          <Segmented<Sort>
            options={[
              { value: 'recent', label: 'Last active' },
              { value: 'name', label: 'Name' },
              { value: 'sets', label: 'Most sets' },
            ]}
            value={sort}
            onChange={setSort}
          />

          {students.length === 0 && <Muted>No student matches “{search}”.</Muted>}
          {students.map((s) => (
            <ListRow key={s.id} onPress={() => router.push({ pathname: '/student/[id]', params: { id: s.id } })} accessibilityLabel={`${s.name}, ${s.status}`}>
              <Row gap={12}>
                <Avatar name={s.name} size={40} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Body style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>
                      {s.name}
                    </Body>
                    <StatusBadge status={s.status} />
                  </Row>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Muted style={{ fontSize: 13, flex: 1 }}>
                      {plural(s.setsThisCycle, 'set')} this cycle · {s.lastActive ? `active ${formatDate(s.lastActive)}` : 'not started'}
                    </Muted>
                    <Sparkline values={s.weekly} width={64} height={22} />
                  </Row>
                </View>
              </Row>
            </ListRow>
          ))}

          <InviteCodeCard code={query.data.inviteCode} />
        </>
      )}
    </Screen>
  )
}
