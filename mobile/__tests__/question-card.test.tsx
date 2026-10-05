import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, userEvent } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import { QuestionCard } from '@/components/speaking/QuestionCard'
import type { FeedbackItem } from '@/lib/types'

const mockApi = jest.fn()
const mockReloadMe = jest.fn()

jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ api: mockApi, reloadMe: mockReloadMe }) }))
// The recorder needs the microphone; it has nothing to do with feedback.
jest.mock('@/components/speaking/AnswerRecorder', () => ({ AnswerRecorder: () => null }))

const item: FeedbackItem = {
  id: 'f1',
  setId: 'set-1',
  topic: 'Hometown',
  questionIndex: 0,
  question: 'Where is your hometown?',
  answerText: 'x',
  createdAt: '2026-10-05T10:00:00.000Z',
  result: {
    estimatedBand: 6,
    fluencyCoherence: { score: 6, comment: 'Fine.' },
    lexicalResource: { score: 6, comment: 'Fine.' },
    grammaticalRange: { score: 5.5, comment: 'Fine.' },
    pronunciationNote: 'Listen back.',
    strengths: ['Direct answer.'],
    improvements: ['Add detail.'],
    improvedAnswer: 'Better answer.',
    usefulPhrases: [],
  },
}

// gcTime: Infinity stops React Query leaving a five-minute cleanup timer running after the test.
let client: QueryClient
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>

const renderCard = (ai = { enabled: true, remaining: 3, limit: 10 }) =>
  render(
    <QuestionCard
      setId="set-1"
      index={0}
      question="Where is your hometown?"
      answer="I come from Jaipur."
      practice
      open
      onToggle={() => undefined}
      ai={ai}
      lastFeedback={null}
      onSpoken={() => undefined}
    />,
    { wrapper },
  )

describe('QuestionCard', () => {
  beforeEach(() => {
    mockApi.mockReset()
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } })
  })
  afterEach(() => client.clear())

  it('reveals the sample answer on tap', async () => {
    const user = userEvent.setup()
    await renderCard()
    expect(screen.queryByText('I come from Jaipur.')).not.toBeOnTheScreen()
    await user.press(screen.getByRole('button', { name: 'Show sample answer' }))
    expect(screen.getByText('I come from Jaipur.')).toBeOnTheScreen()
  })

  it('needs 20 characters before asking for feedback, then shows it', async () => {
    const user = userEvent.setup()
    mockApi.mockResolvedValueOnce({ item, usedToday: 8, limit: 10 })
    await renderCard()
    const ask = screen.getByRole('button', { name: 'Get AI feedback' })
    expect(ask).toBeDisabled()

    const answer = 'I come from Jaipur, a big and colourful city.'
    await user.type(screen.getByLabelText('Your answer in words'), answer)
    expect(ask).toBeEnabled()
    await user.press(ask)

    expect(mockApi).toHaveBeenCalledWith('/api/app/feedback', { method: 'POST', body: { setId: 'set-1', questionIndex: 0, answerText: answer } })
    expect(await screen.findByLabelText('Estimated band 6.0')).toBeOnTheScreen()
  })

  it('says when the daily limit is used up', async () => {
    await renderCard({ enabled: true, remaining: 0, limit: 10 })
    expect(screen.getByText(/used all 10 feedback requests/)).toBeOnTheScreen()
  })

  it('hides AI feedback when it is switched off', async () => {
    await renderCard({ enabled: false, remaining: 0, limit: 10 })
    expect(screen.queryByRole('button', { name: 'Get AI feedback' })).not.toBeOnTheScreen()
  })
})
