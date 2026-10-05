import { router, Stack, useLocalSearchParams } from 'expo-router'

import { useDashboard, useNextSets } from '@/api/hooks'
import { Hint, QueryState, Section } from '@/components/layout'
import { AssignmentRow, SetRow } from '@/components/rows'
import { Button, EmptyState, Muted, Screen, Title } from '@/components/ui'
import { plural } from '@/lib/format'

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const query = useNextSets(slug)
  const dashboard = useDashboard()
  const data = query.data

  if (!data) return <QueryState isPending={query.isPending} error={query.error} onRetry={() => query.refetch()} />

  const assigned = (dashboard.data?.assignments ?? []).filter((a) => !a.done && a.categoryId === data.category.id)
  const openSet = (id: string) => router.push({ pathname: '/set/[id]', params: { id } })

  return (
    <Screen edges={[]} refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Stack.Screen options={{ title: data.category.name }} />
      <Title>{data.category.name}</Title>
      <Muted testID="remaining-count">
        {data.remaining > 0 ? `${plural(data.remaining, 'new set')} left in this part.` : 'No new sets left in this part.'}
      </Muted>

      {assigned.length > 0 && (
        <Section title="Assigned to you">
          {assigned.map((a) => (
            <AssignmentRow key={a.id} assignment={a} onPress={() => a.setId && openSet(a.setId)} />
          ))}
        </Section>
      )}

      {data.sets.length ? (
        <Section title="Your next sets">
          {data.sets.map((set) => (
            <SetRow key={set.id} set={set} onPress={() => openSet(set.id)} />
          ))}
          <Hint>Practise one and mark it as practised: the next new set appears here.</Hint>
        </Section>
      ) : (
        <EmptyState
          icon="trophy-outline"
          title={`You have practised every set in ${data.category.name}`}
          message="Start a new practice cycle to make every set new again. Your history is kept."
          action={<Button title="Go to cycle settings" variant="outline" onPress={() => router.push('/me')} />}
        />
      )}
    </Screen>
  )
}
