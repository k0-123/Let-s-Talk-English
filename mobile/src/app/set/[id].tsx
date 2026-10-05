import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useCallback, useState } from 'react'
import { Image, View } from 'react-native'

import { useRecordPractice, useSet } from '@/api/hooks'
import { useAuth } from '@/auth/AuthProvider'
import { ConfidencePicker } from '@/components/ConfidencePicker'
import { Disclosure, QueryState } from '@/components/layout'
import { Part2Timer } from '@/components/speaking/Part2Timer'
import { QuestionCard } from '@/components/speaking/QuestionCard'
import { Badge, Body, Button, Card, ErrorBanner, Heading, Muted, Row, Screen, SuccessBanner, Title } from '@/components/ui'
import { ApiError } from '@/lib/api'
import { API_URL } from '@/lib/config'
import { confirm, vibrate } from '@/lib/device'
import { formatClock, formatDate } from '@/lib/format'

const absolute = (url: string) => (url.startsWith('http') ? url : `${API_URL}${url}`)

/**
 * One question set. Students practise it (speaking tools, AI feedback, mark as
 * practised); an educator opening it from a student's page can mark it as
 * covered for that student.
 */
export default function SetScreen() {
  const { id, student } = useLocalSearchParams<{ id: string; student?: string }>()
  const { me, token } = useAuth()
  const query = useSet(id, student)
  const record = useRecordPractice()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [spoken, setSpoken] = useState(0)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [showTimer, setShowTimer] = useState<boolean | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const addSpoken = useCallback((seconds: number) => setSpoken((s) => s + seconds), [])

  const data = query.data
  if (!data || !me) return <QueryState isPending={query.isPending} error={query.error} onRetry={() => query.refetch()} />

  const { set } = data
  const isStudent = me.user.role === 'student'
  const isPart2 = set.category?.slug === 'part-2'
  const timerVisible = isStudent && (showTimer ?? isPart2)
  const remaining = Math.max(0, me.ai.limit - me.ai.usedToday)
  const lastFeedbackFor = (index: number) => data.feedback.find((f) => f.questionIndex === index) ?? null

  const markPractised = async () => {
    if (!isStudent) {
      const ok = await confirm('Mark as covered?', 'This set will count as done for this student and won’t be offered to them again in this cycle.', 'Mark as covered')
      if (!ok) return
    }
    try {
      await record.mutateAsync({
        setId: set.id,
        studentId: isStudent ? undefined : student,
        confidence: isStudent ? confidence : undefined,
        speakingSeconds: isStudent && spoken > 0 ? spoken : undefined,
      })
      vibrate('success')
      setJustSaved(true)
    } catch {
      // Shown from record.error below.
    }
  }

  return (
    <Screen edges={[]} refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Stack.Screen options={{ title: set.category?.name ?? 'Question set' }} />
      <View style={{ gap: 8 }}>
        {set.category && <Badge label={set.category.name} tone="secondary" />}
        <Title testID="set-topic">{set.topic}</Title>
        {data.practisedAt && !justSaved && (
          <Badge label={`${isStudent ? 'Practised' : 'Done'} on ${formatDate(data.practisedAt)}`} icon="checkmark-circle" tone="success" />
        )}
      </View>

      {set.imageUrl && (
        <Image
          source={{ uri: absolute(set.imageUrl), headers: token ? { Authorization: `JWT ${token}` } : undefined }}
          style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 16 }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      )}

      {timerVisible && <Part2Timer onSpoken={addSpoken} />}
      {isStudent && !isPart2 && (
        <Button
          title={timerVisible ? 'Hide the 2-minute timer' : 'Use the 2-minute timer'}
          icon="timer-outline"
          variant="ghost"
          size="sm"
          onPress={() => setShowTimer(!timerVisible)}
        />
      )}

      <Heading>Questions</Heading>
      {set.questions.map((q, i) => (
        <QuestionCard
          key={i}
          setId={set.id}
          index={i}
          question={q.question}
          answer={q.answer}
          practice={isStudent}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          ai={{ enabled: me.ai.enabled, remaining, limit: me.ai.limit }}
          lastFeedback={lastFeedbackFor(i)}
          onSpoken={addSpoken}
        />
      ))}

      {set.vocabulary.length > 0 && (
        <Disclosure title={`Vocabulary (${set.vocabulary.length})`} icon="book-outline" testID="vocabulary-toggle">
          {set.vocabulary.map((v, i) => (
            <View key={i} style={{ gap: 2 }}>
              <Body style={{ fontWeight: '700' }}>{v.term}</Body>
              {v.meaning ? <Muted>{v.meaning}</Muted> : null}
            </View>
          ))}
        </Disclosure>
      )}
      {set.tips ? (
        <Disclosure title="Tips" icon="bulb-outline">
          <Body>{set.tips}</Body>
        </Disclosure>
      ) : null}

      {justSaved ? (
        <Card accent testID="practised-card">
          <SuccessBanner message={isStudent ? 'Saved! This set won’t be offered again in this cycle.' : 'Marked as covered for this student.'} />
          {isStudent && set.category ? (
            <Row style={{ flexWrap: 'wrap' }}>
              <Button
                title="Next set"
                icon="arrow-forward"
                style={{ flex: 1 }}
                onPress={() => router.dismissTo({ pathname: '/category/[slug]', params: { slug: set.category!.slug } })}
              />
              <Button title="Home" variant="outline" style={{ flex: 1 }} onPress={() => router.dismissTo('/home')} />
            </Row>
          ) : (
            <Button title="Back" variant="outline" onPress={() => router.back()} />
          )}
        </Card>
      ) : data.practisedAt ? (
        <Card>
          <Body style={{ fontWeight: '700' }}>{isStudent ? 'You have practised this set' : 'Done in this cycle'}</Body>
          <Muted>
            {isStudent
              ? `On ${formatDate(data.practisedAt)}. You can revise it any time; it won’t be offered as a new set again in this cycle.`
              : `Practised or covered on ${formatDate(data.practisedAt)}.`}
          </Muted>
        </Card>
      ) : isStudent ? (
        <Card accent testID="mark-card">
          <Heading>Finished practising?</Heading>
          <Muted>How confident were you?</Muted>
          <ConfidencePicker value={confidence} onChange={setConfidence} />
          {spoken > 0 && <Muted style={{ fontSize: 13 }}>Speaking time this session: {formatClock(spoken)}</Muted>}
          {record.error && <ErrorBanner message={record.error instanceof ApiError ? record.error.message : 'Could not save. Please try again.'} />}
          <Button title="Mark as practised" icon="checkmark-circle" size="lg" onPress={markPractised} loading={record.isPending} testID="mark-practised" />
        </Card>
      ) : student ? (
        <Card accent>
          <Heading>Covered this in a lesson?</Heading>
          <Muted>Mark it as covered so it counts as done and isn’t offered to the student again in this cycle.</Muted>
          {record.error && <ErrorBanner message={record.error instanceof ApiError ? record.error.message : 'Could not save. Please try again.'} />}
          <Button title="Mark as covered" icon="checkmark-done" onPress={markPractised} loading={record.isPending} testID="mark-covered" />
        </Card>
      ) : null}
    </Screen>
  )
}
