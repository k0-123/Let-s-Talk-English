import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'

import { formatDate, formatDue, formatSpoken, plural } from '@/lib/format'
import type { Assignment, CategoryCount, HistoryEntry, SetSummary } from '@/lib/types'
import { useAppTheme } from '@/theme/ThemeProvider'

import { Badge, Body, Card, ListRow, Muted, ProgressBar, Row } from './ui'

export const AssignmentStatus = ({ assignment }: { assignment: Assignment }) =>
  assignment.done ? (
    <Badge label="Done" icon="checkmark-circle" tone="success" />
  ) : assignment.overdue ? (
    <Badge label="Overdue" icon="alert-circle" tone="danger" />
  ) : (
    <Badge label="To do" icon="ellipse-outline" tone="outline" />
  )

export const AssignmentRow = ({ assignment, onPress, showStudent = false }: { assignment: Assignment; onPress: () => void; showStudent?: boolean }) => (
  <ListRow onPress={onPress} accessibilityLabel={`${assignment.topic ?? 'Set'}${assignment.done ? ', done' : assignment.overdue ? ', overdue' : ''}`}>
    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Body style={{ fontWeight: '700', flex: 1 }} numberOfLines={2}>
        {assignment.topic ?? 'Set no longer available'}
      </Body>
      <AssignmentStatus assignment={assignment} />
    </Row>
    <Muted style={{ fontSize: 13 }}>
      {[showStudent ? assignment.studentName : null, assignment.dueDate ? `Due ${formatDue(assignment.dueDate)}` : 'No due date'].filter(Boolean).join(' · ')}
    </Muted>
    {assignment.note ? <Muted style={{ fontSize: 13, fontStyle: 'italic' }}>“{assignment.note}”</Muted> : null}
  </ListRow>
)

export const HistoryRow = ({ entry, categoryName, onPress }: { entry: HistoryEntry; categoryName?: string; onPress: () => void }) => {
  const { colors } = useAppTheme()
  const details = [
    categoryName,
    entry.confidence ? `Confidence ${entry.confidence}/5` : null,
    formatSpoken(entry.speakingSeconds),
  ].filter(Boolean)
  return (
    <ListRow onPress={onPress} accessibilityLabel={`${entry.topic ?? 'Set'}, ${formatDate(entry.practisedAt)}`}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Body style={{ fontWeight: '700', flex: 1 }} numberOfLines={2}>
          {entry.topic ?? 'Set no longer available'}
        </Body>
        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{formatDate(entry.practisedAt)}</Text>
      </Row>
      {details.length > 0 && <Muted style={{ fontSize: 13 }}>{details.join(' · ')}</Muted>}
      {entry.markedBy !== 'student' && <Badge label={entry.markedBy === 'educator' ? 'Covered by educator' : 'Marked by admin'} icon="person" tone="secondary" />}
    </ListRow>
  )
}

const CategoryBody = ({ category }: { category: CategoryCount }) => {
  const done = category.total - category.remaining
  return (
    <>
      <Row style={{ justifyContent: 'space-between' }}>
        <Body style={{ fontWeight: '700', flex: 1 }}>{category.name}</Body>
        <Muted style={{ fontSize: 13 }}>{category.remaining > 0 ? `${category.remaining} new` : 'All done'}</Muted>
      </Row>
      {category.description ? <Muted style={{ fontSize: 13 }}>{category.description}</Muted> : null}
      <ProgressBar value={done} max={category.total} label={`${done} of ${category.total} practised`} />
      <Muted style={{ fontSize: 12 }}>
        {done} of {category.total} practised this cycle
      </Muted>
    </>
  )
}

export const CategoryRow = ({ category, onPress }: { category: CategoryCount; onPress: () => void }) => (
  <ListRow onPress={onPress} accessibilityLabel={`${category.name}: ${plural(category.remaining, 'new set')}`} testID={`category-${category.slug}`}>
    <CategoryBody category={category} />
  </ListRow>
)

/** The same progress, read-only (the educator's view of a student). */
export const CategoryProgress = ({ category }: { category: CategoryCount }) => (
  <Card style={{ gap: 4 }}>
    <CategoryBody category={category} />
  </Card>
)

export const SetRow = ({ set, onPress, right }: { set: SetSummary; onPress: () => void; right?: React.ReactNode }) => {
  const { colors } = useAppTheme()
  return (
    <ListRow onPress={onPress} accessibilityLabel={set.topic} testID={`set-row-${set.id}`}>
      <Row style={{ alignItems: 'flex-start' }} gap={12}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Body style={{ fontWeight: '700' }} numberOfLines={2}>
            {set.topic}
          </Body>
          <Muted style={{ fontSize: 13 }}>{plural(set.questionCount, 'question')}</Muted>
        </View>
        {right}
      </Row>
    </ListRow>
  )
}
