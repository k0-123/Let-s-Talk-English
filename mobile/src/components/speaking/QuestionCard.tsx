import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { useAskFeedback } from '@/api/hooks'
import { ApiError } from '@/lib/api'
import type { FeedbackItem } from '@/lib/types'
import { useAppTheme } from '@/theme/ThemeProvider'

import { FeedbackCard } from '../FeedbackCard'
import { Body, Button, Card, ErrorBanner, Muted, Row, TextField } from '../ui'

import { AnswerRecorder } from './AnswerRecorder'

export const MIN_ANSWER = 20
export const MAX_ANSWER = 2000

type Props = {
  setId: string
  index: number
  question: string
  answer: string | null
  /** Speaking tools (record, answer, AI feedback). Off for an educator's view. */
  practice: boolean
  open: boolean
  onToggle: () => void
  ai: { enabled: boolean; remaining: number; limit: number }
  lastFeedback: FeedbackItem | null
  onSpoken: (seconds: number) => void
}

/** One question: tap to reveal the sample answer, and practise it with the recorder and AI feedback. */
export const QuestionCard = ({ setId, index, question, answer, practice, open, onToggle, ai, lastFeedback, onSpoken }: Props) => {
  const { colors } = useAppTheme()
  const [showAnswer, setShowAnswer] = useState(false)
  const [text, setText] = useState('')
  const [result, setResult] = useState<FeedbackItem | null>(null)
  const [showLast, setShowLast] = useState(false)
  const ask = useAskFeedback()

  const length = text.trim().length
  const askFeedback = async () => {
    try {
      const { item } = await ask.mutateAsync({ setId, questionIndex: index, answerText: text.trim() })
      if (item?.result) setResult(item)
    } catch {
      // The error is shown from ask.error below.
    }
  }

  return (
    <Card testID={`question-${index}`}>
      <Row style={{ alignItems: 'flex-start' }} gap={12}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.primary, fontWeight: '800' }}>{index + 1}</Text>
        </View>
        <Body style={{ flex: 1, fontWeight: '600', fontSize: 16 }}>{question}</Body>
      </Row>

      {answer ? (
        <View style={{ gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showAnswer ? 'Hide sample answer' : 'Show sample answer'}
            accessibilityState={{ expanded: showAnswer }}
            onPress={() => setShowAnswer((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
          >
            <Ionicons name={showAnswer ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '600' }}>{showAnswer ? 'Hide sample answer' : 'Show sample answer'}</Text>
          </Pressable>
          {showAnswer && (
            <View style={{ backgroundColor: colors.muted, borderRadius: 12, padding: 12 }}>
              <Body style={{ fontSize: 14 }}>{answer}</Body>
            </View>
          )}
        </View>
      ) : null}

      {practice && (
        <View style={{ gap: 12 }}>
          <Button
            title={open ? 'Close practice' : 'Practise this question'}
            icon={open ? 'chevron-up' : 'mic-outline'}
            variant={open ? 'ghost' : 'secondary'}
            size="sm"
            onPress={onToggle}
            testID={`practise-${index}`}
          />
          {open && (
            <View style={{ gap: 12 }}>
              <AnswerRecorder onRecorded={onSpoken} />
              <TextField
                label="Your answer in words"
                hint="Type it, or tap the microphone on your keyboard to dictate."
                placeholder="Say or type your answer…"
                value={text}
                onChangeText={(value) => {
                  setText(value)
                  if (result) setResult(null)
                }}
                multiline
                maxLength={MAX_ANSWER}
                testID={`answer-${index}`}
              />
              {ai.enabled && (
                <View style={{ gap: 8 }}>
                  {ask.error && <ErrorBanner message={ask.error instanceof ApiError ? ask.error.message : 'Feedback could not be loaded. Please try again.'} />}
                  <Button
                    title="Get AI feedback"
                    icon="sparkles"
                    onPress={askFeedback}
                    loading={ask.isPending}
                    disabled={length < MIN_ANSWER || ai.remaining <= 0}
                    testID={`ask-feedback-${index}`}
                  />
                  <Muted style={{ fontSize: 12, textAlign: 'center' }}>
                    {ai.remaining <= 0
                      ? `You have used all ${ai.limit} feedback requests for today. Try again tomorrow.`
                      : length < MIN_ANSWER
                        ? `Write at least ${MIN_ANSWER} characters (${length}/${MIN_ANSWER}).`
                        : `${ai.remaining} of ${ai.limit} feedback requests left today. Only your text is sent.`}
                  </Muted>
                </View>
              )}
              {result && <FeedbackCard result={result.result} />}
            </View>
          )}
          {!result && lastFeedback && (
            <View style={{ gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showLast ? 'Hide your last feedback' : `Your last feedback: band ${lastFeedback.result.estimatedBand.toFixed(1)}`}
                accessibilityState={{ expanded: showLast }}
                onPress={() => setShowLast((v) => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
              >
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {showLast ? 'Hide your last feedback' : `Your last feedback: band ${lastFeedback.result.estimatedBand.toFixed(1)}`}
                </Text>
              </Pressable>
              {showLast && (
                <View style={{ gap: 8 }}>
                  <Muted style={{ fontStyle: 'italic' }}>“{lastFeedback.answerText}”</Muted>
                  <FeedbackCard result={lastFeedback.result} />
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </Card>
  )
}
