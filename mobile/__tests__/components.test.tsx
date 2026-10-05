import { render, screen, userEvent } from '@testing-library/react-native'

import { ConfidencePicker } from '@/components/ConfidencePicker'
import { FeedbackCard } from '@/components/FeedbackCard'
import { StatusBadge } from '@/components/StatusBadge'
import type { FeedbackResult } from '@/lib/types'

const result: FeedbackResult = {
  estimatedBand: 6.5,
  fluencyCoherence: { score: 6.5, comment: 'Clear and on topic.' },
  lexicalResource: { score: 6, comment: 'Try less common words.' },
  grammaticalRange: { score: 6.5, comment: 'Good mix of tenses.' },
  pronunciationNote: 'Record yourself and listen for word stress.',
  strengths: ['You answered directly.'],
  improvements: ['Add an example.'],
  improvedAnswer: 'I live in a quiet flat near the centre.',
  usefulPhrases: ['on the whole'],
}

describe('ConfidencePicker', () => {
  it('chooses a rating, and clears it when tapped again', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    const { rerender } = await render(<ConfidencePicker value={null} onChange={onChange} />)
    await user.press(screen.getByRole('radio', { name: '4: Quite' }))
    expect(onChange).toHaveBeenLastCalledWith(4)

    await rerender(<ConfidencePicker value={4} onChange={onChange} />)
    expect(screen.getByRole('radio', { name: '4: Quite' })).toBeSelected()
    await user.press(screen.getByRole('radio', { name: '4: Quite' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
  })
})

describe('FeedbackCard', () => {
  it('shows the band as an estimate, the criteria and the advice', async () => {
    await render(<FeedbackCard result={result} />)
    expect(screen.getByLabelText('Estimated band 6.5')).toBeOnTheScreen()
    expect(screen.getByText(/not an official IELTS score/)).toBeOnTheScreen()
    expect(screen.getByRole('progressbar', { name: 'Vocabulary: 6.0 out of 9' })).toBeOnTheScreen()
    expect(screen.getByText('You answered directly.')).toBeOnTheScreen()
    expect(screen.getByText('Add an example.')).toBeOnTheScreen()
    expect(screen.getByText('I live in a quiet flat near the centre.')).toBeOnTheScreen()
    expect(screen.getByText('on the whole')).toBeOnTheScreen()
  })
})

describe('StatusBadge', () => {
  it('always pairs the colour with a word', async () => {
    await render(<StatusBadge status="slipping" />)
    expect(screen.getByText('Slipping')).toBeOnTheScreen()
  })
})
