import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { useCategories, useFeedbackList, useHistory } from '@/api/hooks'
import { formatDate, plural } from '@/lib/format'
import type { FeedbackItem } from '@/lib/types'
import { useAppTheme } from '@/theme/ThemeProvider'

import { FeedbackCard } from './FeedbackCard'
import { LoadMore, QueryState } from './layout'
import { HistoryRow } from './rows'
import { Badge, Body, Card, Chip, EmptyState, Muted, Row } from './ui'

/** A student's practised sets, filterable by part, 20 at a time. Also used on the educator's student page. */
export const PractisedSets = ({ studentId }: { studentId?: string }) => {
  const [category, setCategory] = useState<string | undefined>()
  const categories = useCategories()
  const history = useHistory({ category, student: studentId })
  const names = Object.fromEntries((categories.data?.categories ?? []).map((c) => [c.id, c.name]))
  const entries = history.data?.pages.flatMap((p) => p.entries) ?? []
  const total = history.data?.pages[0]?.totalDocs ?? 0

  return (
    <View style={{ gap: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label="All" active={!category} onPress={() => setCategory(undefined)} />
        {(categories.data?.categories ?? []).map((c) => (
          <Chip key={c.id} label={c.name} active={category === c.slug} onPress={() => setCategory(c.slug)} />
        ))}
      </ScrollView>
      {!history.data ? (
        <QueryState isPending={history.isPending} error={history.error} onRetry={() => history.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState icon="time-outline" title="Nothing here yet" message="Sets you practise (or your educator covers with you) appear here." />
      ) : (
        <>
          <Muted>{plural(total, 'set')} practised</Muted>
          {entries.map((entry) => (
            <HistoryRow
              key={entry.id}
              entry={entry}
              categoryName={entry.categoryId ? names[entry.categoryId] : undefined}
              onPress={() =>
                entry.setId &&
                router.push({ pathname: '/set/[id]', params: studentId ? { id: entry.setId, student: studentId } : { id: entry.setId } })
              }
            />
          ))}
          <LoadMore hasMore={!!history.hasNextPage} loading={history.isFetchingNextPage} onPress={() => history.fetchNextPage()} />
        </>
      )}
    </View>
  )
}

const FeedbackRow = ({ item }: { item: FeedbackItem }) => {
  const { colors } = useAppTheme()
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.topic ?? 'Question set'}, question ${item.questionIndex + 1}, band ${item.result.estimatedBand.toFixed(1)}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={{ gap: 6 }}
      >
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Body style={{ fontWeight: '700', flex: 1 }} numberOfLines={2}>
            {item.topic ?? 'Question set'}
          </Body>
          <Badge label={`Band ${item.result.estimatedBand.toFixed(1)}`} tone="secondary" />
        </Row>
        <Muted numberOfLines={open ? undefined : 2}>
          Q{item.questionIndex + 1}: {item.question}
        </Muted>
        <Row style={{ justifyContent: 'space-between' }}>
          <Muted style={{ fontSize: 12 }}>{formatDate(item.createdAt)}</Muted>
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>{open ? 'Hide' : 'Show feedback'}</Text>
        </Row>
      </Pressable>
      {open && (
        <View style={{ gap: 10 }}>
          <Muted style={{ fontStyle: 'italic' }}>“{item.answerText}”</Muted>
          <FeedbackCard result={item.result} />
        </View>
      )}
    </Card>
  )
}

export const FeedbackHistory = ({ studentId }: { studentId?: string }) => {
  const query = useFeedbackList(studentId ? { student: studentId } : {})
  if (!query.data) return <QueryState isPending={query.isPending} error={query.error} onRetry={() => query.refetch()} />
  if (!query.data.items.length) {
    return (
      <EmptyState
        icon="sparkles-outline"
        title="No AI feedback yet"
        message={studentId ? 'Feedback the student asks for appears here.' : 'Open a set, practise a question and tap “Get AI feedback”.'}
      />
    )
  }
  return (
    <View style={{ gap: 12 }}>
      {query.data.items.map((item) => (
        <FeedbackRow key={item.id} item={item} />
      ))}
    </View>
  )
}
