import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Text, View } from 'react-native'

import { useDashboard } from '@/api/hooks'
import { useAuth } from '@/auth/AuthProvider'
import { GoalRing, Heatmap } from '@/components/charts'
import { QueryState, Section } from '@/components/layout'
import { AssignmentRow, CategoryRow, HistoryRow } from '@/components/rows'
import { Avatar, Badge, Body, Button, Card, Heading, Muted, Row, Screen, StatTile, Title } from '@/components/ui'
import { firstName, plural, todayKey } from '@/lib/format'
import type { Dashboard } from '@/lib/types'
import { useAppTheme } from '@/theme/ThemeProvider'

const goalMessage = (done: number, goal: number) => {
  if (done >= goal) return 'Weekly goal reached. Great work!'
  const left = goal - done
  return `${plural(left, 'more set')} to reach your goal.`
}

/** Where "Continue practising" goes: an open assignment first, then the first part with new sets. */
const nextStep = (data: Dashboard): { label: string; go: () => void } | null => {
  const assigned = data.assignments.find((a) => !a.done && a.setId)
  if (assigned?.setId) return { label: 'Start your assigned set', go: () => router.push({ pathname: '/set/[id]', params: { id: assigned.setId! } }) }
  const category = data.categories.find((c) => c.remaining > 0)
  if (category) return { label: `Practise ${category.name}`, go: () => router.push({ pathname: '/category/[slug]', params: { slug: category.slug } }) }
  return null
}

export default function Home() {
  const { me } = useAuth()
  const { colors } = useAppTheme()
  const dashboard = useDashboard()
  const data = dashboard.data

  if (!data || !me) return <QueryState isPending={dashboard.isPending} error={dashboard.error} onRetry={() => dashboard.refetch()} />

  const { progress } = data
  const categoryNames = Object.fromEntries(data.categories.map((c) => [c.id, c.name]))
  const openAssignments = data.assignments.filter((a) => !a.done)
  const step = nextStep(data)

  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Muted>Welcome back</Muted>
          <Title testID="home-title">Hi, {firstName(me.user.name)}</Title>
        </View>
        <Avatar name={me.user.name} size={44} />
      </Row>

      {!me.user.hasEducator && (
        <Card accent>
          <Row gap={10}>
            <Ionicons name="people" size={20} color={colors.primary} />
            <Heading style={{ flex: 1 }}>Join your educator</Heading>
          </Row>
          <Muted>Enter the invite code from your teacher so they can follow your progress and assign you sets.</Muted>
          <Button title="Enter invite code" icon="key-outline" onPress={() => router.push('/join')} />
        </Card>
      )}

      <Card>
        <Row gap={16}>
          <GoalRing value={progress.thisWeek} goal={progress.weeklyGoal} />
          <View style={{ flex: 1, gap: 4 }}>
            <Muted style={{ fontSize: 13 }}>This week</Muted>
            <Body style={{ fontWeight: '700', fontSize: 17 }}>
              {progress.thisWeek} of {progress.weeklyGoal} sets
            </Body>
            <Muted>{goalMessage(progress.thisWeek, progress.weeklyGoal)}</Muted>
          </View>
        </Row>
        {step ? (
          <Button title={step.label} icon="play" onPress={step.go} testID="continue-practising" />
        ) : (
          <Muted>You have practised every set. Start a new cycle on the Me tab to go again.</Muted>
        )}
      </Card>

      <Row style={{ flexWrap: 'wrap', alignItems: 'stretch' }} gap={12}>
        <StatTile
          icon="flame"
          tone="streak"
          label="Day streak"
          value={progress.streak.current}
          hint={progress.streak.practisedToday ? 'Practised today' : progress.streak.current > 0 ? 'Practise today to keep it' : `Best: ${progress.streak.best}`}
        />
        <StatTile icon="checkmark-done" tone="success" label="This cycle" value={progress.totalThisCycle} hint={`${progress.totalAllTime} sets in total`} />
      </Row>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Heading>Practice calendar</Heading>
          {progress.streak.best > 0 && <Badge label={`Best streak ${progress.streak.best}`} icon="trophy-outline" tone="secondary" />}
        </Row>
        <Heatmap days={progress.activity} today={todayKey()} />
      </Card>

      {openAssignments.length > 0 && (
        <Section title="Assigned by your educator">
          {openAssignments.slice(0, 5).map((a) => (
            <AssignmentRow key={a.id} assignment={a} onPress={() => a.setId && router.push({ pathname: '/set/[id]', params: { id: a.setId } })} />
          ))}
        </Section>
      )}

      <Section title="Progress by part">
        {data.categories.length ? (
          data.categories.map((c) => (
            <CategoryRow key={c.id} category={c} onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: c.slug } })} />
          ))
        ) : (
          <Muted>No question sets are published yet.</Muted>
        )}
      </Section>

      {data.recent.length > 0 && (
        <Section
          title="Recently practised"
          action={
            <Text onPress={() => router.push('/history')} style={{ color: colors.primary, fontWeight: '600' }}>
              See all
            </Text>
          }
        >
          {data.recent.map((entry) => (
            <HistoryRow
              key={entry.id}
              entry={entry}
              categoryName={entry.categoryId ? categoryNames[entry.categoryId] : undefined}
              onPress={() => entry.setId && router.push({ pathname: '/set/[id]', params: { id: entry.setId } })}
            />
          ))}
        </Section>
      )}
    </Screen>
  )
}
