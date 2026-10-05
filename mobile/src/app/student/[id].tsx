import { Ionicons } from '@expo/vector-icons'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'

import { useAddNote, useAssignSets, useDeleteNote, useRecordPractice, useRemoveAssignment, useStudent, useTodo } from '@/api/hooks'
import { Heatmap } from '@/components/charts'
import { FeedbackHistory, PractisedSets } from '@/components/history'
import { Hint, QueryState, Section } from '@/components/layout'
import { AssignmentRow, CategoryProgress, SetRow } from '@/components/rows'
import {
  Avatar,
  Body,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorBanner,
  Heading,
  Muted,
  Row,
  Screen,
  StatTile,
  SuccessBanner,
  TextField,
  Title,
} from '@/components/ui'
import { ApiError } from '@/lib/api'
import { confirm, vibrate } from '@/lib/device'
import { daysFromToday, formatDate, formatDue, plural, todayKey } from '@/lib/format'
import type { StudentDetail } from '@/lib/types'
import { useAppTheme } from '@/theme/ThemeProvider'

type Tab = 'overview' | 'history' | 'todo' | 'assigned' | 'notes' | 'feedback'

const tabs: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'history', label: 'History' },
  { value: 'todo', label: 'Not done yet' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'notes', label: 'Notes' },
  { value: 'feedback', label: 'AI feedback' },
]

const errorText = (error: unknown) => (error instanceof ApiError ? error.message : 'Something went wrong. Please try again.')

const Overview = ({ data }: { data: StudentDetail }) => {
  const { progress } = data
  return (
    <View style={{ gap: 16 }}>
      <Row style={{ flexWrap: 'wrap', alignItems: 'stretch' }} gap={12}>
        <StatTile icon="flame" tone="streak" label="Day streak" value={progress.streak.current} hint={`Best: ${progress.streak.best}`} />
        <StatTile icon="calendar" label="This week" value={`${progress.thisWeek}/${progress.weeklyGoal}`} hint="sets / weekly goal" />
        <StatTile icon="checkmark-done" tone="success" label="This cycle" value={progress.totalThisCycle} hint={`${progress.totalAllTime} in total`} />
        <StatTile
          icon="happy-outline"
          label="Confidence"
          value={progress.averageConfidence ? `${progress.averageConfidence.toFixed(1)}/5` : '—'}
          hint="Average self-rating"
        />
      </Row>
      <Card>
        <Heading>Practice calendar</Heading>
        <Heatmap days={progress.activity} today={todayKey()} />
      </Card>
      <Section title="Progress by part">
        {data.categories.map((c) => (
          <CategoryProgress key={c.id} category={c} />
        ))}
      </Section>
    </View>
  )
}

const dueChoices = [
  { label: 'No due date', days: null },
  { label: 'In 3 days', days: 3 },
  { label: 'In a week', days: 7 },
  { label: 'In 2 weeks', days: 14 },
] as const

/** Fixed at the bottom while sets are selected: due date, note, Assign. */
const AssignBar = ({ studentId, setIds, onDone, onClear }: { studentId: string; setIds: string[]; onDone: (message: string) => void; onClear: () => void }) => {
  const assign = useAssignSets()
  const [due, setDue] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const submit = async () => {
    try {
      const result = await assign.mutateAsync({ studentId, setIds, note: note.trim() || undefined, dueDate: due ? daysFromToday(due) : null })
      vibrate('success')
      setNote('')
      onDone(
        `Assigned ${plural(result.created, 'set')}${result.skipped ? ` (${result.skipped} already assigned)` : ''}${due ? `, due ${formatDue(daysFromToday(due))}` : ''}.`,
      )
    } catch {
      // Shown below.
    }
  }

  return (
    <View style={{ gap: 10 }} testID="assign-panel">
      <Row style={{ justifyContent: 'space-between' }}>
        <Heading>{plural(setIds.length, 'set')} selected</Heading>
        <Button title="Clear" variant="ghost" size="sm" onPress={onClear} />
      </Row>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {dueChoices.map((c) => (
          <Chip key={c.label} label={c.label} active={due === c.days} onPress={() => setDue(c.days)} />
        ))}
      </ScrollView>
      <TextField label="Note for the student (optional)" value={note} onChangeText={setNote} placeholder="e.g. Focus on linking words" maxLength={300} />
      {assign.error && <ErrorBanner message={errorText(assign.error)} />}
      <Button title={`Assign ${plural(setIds.length, 'set')}`} icon="send" onPress={submit} loading={assign.isPending} testID="assign-submit" />
    </View>
  )
}

const NotDoneYet = ({
  data,
  selected,
  onToggle,
  notice,
  onNotice,
}: {
  data: StudentDetail
  selected: string[]
  onToggle: (id: string) => void
  notice: string | null
  onNotice: (message: string) => void
}) => {
  const studentId = data.student.id
  const [category, setCategory] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const todo = useTodo(studentId, { category, q: search.trim() || undefined, page })
  const cover = useRecordPractice()
  const { colors } = useAppTheme()

  const markCovered = async (setId: string, topic: string) => {
    const ok = await confirm('Mark as covered?', `“${topic}” will count as done for ${data.student.name} and won’t be offered to them again in this cycle.`, 'Mark as covered')
    if (!ok) return
    try {
      await cover.mutateAsync({ setId, studentId })
      vibrate('success')
      onNotice(`Marked “${topic}” as covered.`)
    } catch {
      // Shown below.
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <Muted>Published sets {data.student.name} hasn’t practised in this cycle. Tick sets to assign them, or mark one as covered after a lesson.</Muted>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label="All parts" active={!category} onPress={() => (setCategory(undefined), setPage(1))} />
        {data.categories.map((c) => (
          <Chip key={c.id} label={c.name} active={category === c.slug} onPress={() => (setCategory(c.slug), setPage(1))} />
        ))}
      </ScrollView>
      <TextField
        label="Search topics"
        value={search}
        onChangeText={(v) => {
          setSearch(v)
          setPage(1)
        }}
        placeholder="e.g. travel"
        autoCapitalize="none"
      />
      {notice && <SuccessBanner message={notice} />}
      {cover.error && <ErrorBanner message={errorText(cover.error)} />}

      {!todo.data ? (
        <QueryState isPending={todo.isPending} error={todo.error} onRetry={() => todo.refetch()} />
      ) : todo.data.sets.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" title="Nothing left here" message="No unpractised sets match. Try another part or search." />
      ) : (
        <>
          <Muted>{plural(todo.data.remaining, 'set')} not done yet</Muted>
          {todo.data.sets.map((set) => {
            const isSelected = selected.includes(set.id)
            return (
              <View key={set.id} style={{ gap: 4 }}>
                <SetRow
                  set={set}
                  onPress={() => router.push({ pathname: '/set/[id]', params: { id: set.id, student: studentId } })}
                  right={
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={`Select ${set.topic}`}
                      hitSlop={10}
                      onPress={() => onToggle(set.id)}
                      testID={`select-${set.id}`}
                    >
                      <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={26} color={isSelected ? colors.primary : colors.mutedForeground} />
                    </Pressable>
                  }
                />
                <Button
                  title="Mark as covered"
                  icon="checkmark-done"
                  variant="ghost"
                  size="sm"
                  style={{ alignSelf: 'flex-end' }}
                  onPress={() => markCovered(set.id, set.topic)}
                />
              </View>
            )
          })}
          {todo.data.totalPages > 1 && (
            <Row style={{ justifyContent: 'space-between' }}>
              <Button title="Previous" icon="chevron-back" variant="outline" size="sm" disabled={page <= 1} onPress={() => setPage(page - 1)} />
              <Muted>
                Page {todo.data.page} of {todo.data.totalPages}
              </Muted>
              <Button title="Next" variant="outline" size="sm" disabled={page >= todo.data.totalPages} onPress={() => setPage(page + 1)} />
            </Row>
          )}
        </>
      )}
    </View>
  )
}

const Assigned = ({ data }: { data: StudentDetail }) => {
  const remove = useRemoveAssignment()
  if (!data.assignments.length) {
    return <EmptyState icon="clipboard-outline" title="Nothing assigned" message="Choose sets on the “Not done yet” tab to assign them." />
  }
  return (
    <View style={{ gap: 12 }}>
      {data.assignments.map((a) => (
        <View key={a.id} style={{ gap: 4 }}>
          <AssignmentRow
            assignment={a}
            onPress={() => a.setId && router.push({ pathname: '/set/[id]', params: { id: a.setId, student: data.student.id } })}
          />
          {!a.done && (
            <Button
              title="Remove"
              icon="trash-outline"
              variant="ghost"
              size="sm"
              style={{ alignSelf: 'flex-end' }}
              onPress={async () => {
                if (await confirm('Remove this assignment?', `${a.topic ?? 'This set'} will no longer be assigned.`, 'Remove', true)) remove.mutate(a.id)
              }}
            />
          )}
        </View>
      ))}
    </View>
  )
}

const Notes = ({ data }: { data: StudentDetail }) => {
  const add = useAddNote()
  const remove = useDeleteNote()
  const [body, setBody] = useState('')
  const save = async () => {
    try {
      await add.mutateAsync({ studentId: data.student.id, body: body.trim() })
      setBody('')
    } catch {
      // Shown below.
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <Hint icon="lock-closed-outline">Notes are private to you. {data.student.name} never sees them.</Hint>
      {add.error && <ErrorBanner message={errorText(add.error)} />}
      <TextField label="New note" value={body} onChangeText={setBody} multiline placeholder="What did you work on? What's next?" maxLength={2000} testID="note-body" />
      <Button title="Add note" icon="add" onPress={save} loading={add.isPending} disabled={!body.trim()} testID="note-submit" />
      {data.notes.map((n) => (
        <Card key={n.id}>
          <Body>{n.body}</Body>
          <Row style={{ justifyContent: 'space-between' }}>
            <Muted style={{ fontSize: 12 }}>{formatDate(n.createdAt)}</Muted>
            <Button
              title="Delete"
              icon="trash-outline"
              variant="ghost"
              size="sm"
              onPress={async () => {
                if (await confirm('Delete this note?', 'This cannot be undone.', 'Delete', true)) remove.mutate(n.id)
              }}
            />
          </Row>
        </Card>
      ))}
    </View>
  )
}

export default function StudentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const query = useStudent(id)
  const [tab, setTab] = useState<Tab>('overview')
  const [selected, setSelected] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const data = query.data
  if (!data) return <QueryState isPending={query.isPending} error={query.error} onRetry={() => query.refetch()} />

  const toggle = (setId: string) => setSelected((s) => (s.includes(setId) ? s.filter((x) => x !== setId) : [...s, setId]))
  const footer =
    tab === 'todo' && selected.length > 0 ? (
      <AssignBar
        studentId={data.student.id}
        setIds={selected}
        onClear={() => setSelected([])}
        onDone={(message) => {
          setSelected([])
          setNotice(message)
        }}
      />
    ) : undefined

  return (
    <Screen edges={[]} refreshing={query.isRefetching} onRefresh={() => query.refetch()} footer={footer}>
      <Stack.Screen options={{ title: data.student.name }} />
      <Row gap={14}>
        <Avatar name={data.student.name} size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Title style={{ fontSize: 22 }} numberOfLines={1}>
            {data.student.name}
          </Title>
          <Muted numberOfLines={1}>
            {data.student.email} · cycle {data.student.cycle}
          </Muted>
        </View>
      </Row>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityRole="tablist">
        {tabs.map((t) => (
          <Chip key={t.value} label={t.label} active={tab === t.value} onPress={() => setTab(t.value)} />
        ))}
      </ScrollView>

      {tab === 'overview' && <Overview data={data} />}
      {tab === 'history' && <PractisedSets studentId={data.student.id} />}
      {tab === 'todo' && <NotDoneYet data={data} selected={selected} onToggle={toggle} notice={notice} onNotice={setNotice} />}
      {tab === 'assigned' && <Assigned data={data} />}
      {tab === 'notes' && <Notes data={data} />}
      {tab === 'feedback' && <FeedbackHistory studentId={data.student.id} />}
    </Screen>
  )
}
