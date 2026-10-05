/**
 * Pure state machine for the IELTS Part 2 timer: 60 seconds to prepare,
 * then up to 120 seconds to speak. The screen calls `tick` once a second.
 */
export const PREP_SECONDS = 60
export const SPEAK_SECONDS = 120

export type TimerPhase = 'idle' | 'prep' | 'speaking' | 'done'
export type TimerState = { phase: TimerPhase; remaining: number; spoken: number }
export type TimerEvent = 'start-speaking' | 'thirty-left' | 'finished' | null

export const initialTimer: TimerState = { phase: 'idle', remaining: PREP_SECONDS, spoken: 0 }

export const startPrep = (): TimerState => ({ phase: 'prep', remaining: PREP_SECONDS, spoken: 0 })

export const startSpeaking = (state: TimerState): TimerState => ({ phase: 'speaking', remaining: SPEAK_SECONDS, spoken: state.spoken })

export const finish = (state: TimerState): TimerState => ({ ...state, phase: 'done', remaining: 0 })

/** Advances one second. Returns the new state and what just happened, for sounds and vibration. */
export const tick = (state: TimerState): { state: TimerState; event: TimerEvent } => {
  if (state.phase === 'prep') {
    if (state.remaining > 1) return { state: { ...state, remaining: state.remaining - 1 }, event: null }
    return { state: startSpeaking(state), event: 'start-speaking' }
  }
  if (state.phase === 'speaking') {
    const spoken = state.spoken + 1
    if (state.remaining > 1) {
      const remaining = state.remaining - 1
      return { state: { ...state, remaining, spoken }, event: remaining === 30 ? 'thirty-left' : null }
    }
    return { state: finish({ ...state, spoken }), event: 'finished' }
  }
  return { state, event: null }
}

/** 0 → 1 progress through the current phase, for the ring. */
export const timerProgress = (state: TimerState): number => {
  if (state.phase === 'idle') return 0
  if (state.phase === 'done') return 1
  const total = state.phase === 'prep' ? PREP_SECONDS : SPEAK_SECONDS
  return 1 - state.remaining / total
}
