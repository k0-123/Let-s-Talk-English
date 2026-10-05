import { PREP_SECONDS, SPEAK_SECONDS, finish, initialTimer, startPrep, startSpeaking, tick, timerProgress, type TimerEvent, type TimerState } from '@/lib/part2-timer'

const run = (state: TimerState, seconds: number) => {
  const events: TimerEvent[] = []
  for (let i = 0; i < seconds; i++) {
    const next = tick(state)
    state = next.state
    if (next.event) events.push(next.event)
  }
  return { state, events }
}

describe('Part 2 timer', () => {
  it('does nothing until started', () => {
    expect(tick(initialTimer)).toEqual({ state: initialTimer, event: null })
    expect(timerProgress(initialTimer)).toBe(0)
  })

  it('moves from one minute of preparation to speaking', () => {
    const { state, events } = run(startPrep(), PREP_SECONDS)
    expect(events).toEqual(['start-speaking'])
    expect(state).toEqual({ phase: 'speaking', remaining: SPEAK_SECONDS, spoken: 0 })
  })

  it('warns at 30 seconds left and finishes after two minutes of speaking', () => {
    const { state, events } = run(startSpeaking(startPrep()), SPEAK_SECONDS)
    expect(events).toEqual(['thirty-left', 'finished'])
    expect(state).toEqual({ phase: 'done', remaining: 0, spoken: SPEAK_SECONDS })
    expect(timerProgress(state)).toBe(1)
  })

  it('counts the seconds spoken when stopped early', () => {
    const { state } = run(startSpeaking(startPrep()), 75)
    expect(state.spoken).toBe(75)
    expect(finish(state)).toEqual({ phase: 'done', remaining: 0, spoken: 75 })
  })

  it('reports progress through the current phase', () => {
    const { state } = run(startPrep(), 30)
    expect(timerProgress(state)).toBeCloseTo(0.5)
  })
})
