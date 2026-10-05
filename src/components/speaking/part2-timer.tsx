'use client'

import { Hourglass, Mic, Pause, Play, RotateCcw, SkipForward, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { beep, formatClock } from './audio-cues'
import { usePracticeSession } from './practice-session'

type Phase = 'idle' | 'prep' | 'speaking' | 'done'

const PREP_SECONDS = 60
const SPEAK_SECONDS = 120

/**
 * IELTS Part 2 long turn: 1 minute to prepare (with a notes box), then up to
 * 2 minutes speaking. Beeps and vibrates at each change.
 */
export const Part2Timer = () => {
  const { addSpeaking } = usePracticeSession()
  const [phase, setPhaseState] = useState<Phase>('idle')
  const [remaining, setRemainingState] = useState(PREP_SECONDS)
  const [paused, setPaused] = useState(false)
  const [notes, setNotes] = useState('')
  // Mirrors of the state for the interval callback (which must not run side effects inside state updaters).
  const phaseRef = useRef<Phase>('idle')
  const remainingRef = useRef(PREP_SECONDS)

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhaseState(p)
  }, [])
  const setRemaining = useCallback((r: number) => {
    remainingRef.current = r
    setRemainingState(r)
  }, [])

  const finishSpeaking = useCallback(() => {
    addSpeaking(SPEAK_SECONDS - remainingRef.current)
    setPhase('done')
    beep(520, 400)
  }, [addSpeaking, setPhase])

  useEffect(() => {
    if ((phase !== 'prep' && phase !== 'speaking') || paused) return
    const id = window.setInterval(() => {
      const next = remainingRef.current - 1
      if (next > 0) {
        if (phaseRef.current === 'speaking' && next === 30) beep(660, 120)
        setRemaining(next)
        return
      }
      if (phaseRef.current === 'prep') {
        beep()
        setPhase('speaking')
        setRemaining(SPEAK_SECONDS)
      } else {
        setRemaining(0)
        finishSpeaking()
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase, paused, finishSpeaking, setPhase, setRemaining])

  const total = phase === 'prep' ? PREP_SECONDS : SPEAK_SECONDS
  const ratio = phase === 'idle' ? 0 : phase === 'done' ? 1 : 1 - remaining / total
  const radius = 15.5
  const circumference = 2 * Math.PI * radius

  const start = () => {
    setPhase('prep')
    setRemaining(PREP_SECONDS)
    setPaused(false)
    beep()
  }

  return (
    <section aria-label="Part 2 timer" className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative mx-auto size-28 shrink-0 sm:mx-0">
          <svg viewBox="0 0 36 36" className="size-28 -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r={radius} fill="none" strokeWidth="3" className="stroke-chart-0" />
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className={cn(phase === 'prep' ? 'stroke-warning' : phase === 'done' ? 'stroke-success' : 'stroke-primary')}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ratio)}
              style={{ transition: 'stroke-dashoffset 900ms linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" aria-live="polite">
            <span className="text-2xl font-bold tabular-nums">{phase === 'idle' ? '1:00' : phase === 'done' ? 'Done' : formatClock(remaining)}</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {phase === 'idle' ? 'Prepare' : phase === 'prep' ? 'Prepare' : phase === 'speaking' ? 'Speak' : 'Well done'}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <Hourglass className="size-4 text-primary" aria-hidden /> Part 2 timer
            </h2>
            <p className="text-sm text-muted-foreground">
              {phase === 'idle' && 'You get 1 minute to make notes, then speak for up to 2 minutes, just like the test.'}
              {phase === 'prep' && 'Make short notes: one word per bullet point is enough.'}
              {phase === 'speaking' && (remaining > 30 ? 'Speak now. Cover every bullet point, then explain why.' : 'Keep going until the time is up!')}
              {phase === 'done' && 'Compare with the sample answer, then mark the set as practised.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {phase === 'idle' || phase === 'done' ? (
              <Button type="button" onClick={start}>
                {phase === 'done' ? <RotateCcw aria-hidden /> : <Play aria-hidden />}
                {phase === 'done' ? 'Start again' : 'Start 1-minute prep'}
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setPaused((p) => !p)}>
                  {paused ? <Play aria-hidden /> : <Pause aria-hidden />} {paused ? 'Resume' : 'Pause'}
                </Button>
                {phase === 'prep' ? (
                  <Button
                    type="button"
                    onClick={() => {
                      beep()
                      setPhase('speaking')
                      setRemaining(SPEAK_SECONDS)
                    }}
                  >
                    <SkipForward aria-hidden /> Start speaking now
                  </Button>
                ) : (
                  <Button type="button" variant="secondary" onClick={finishSpeaking}>
                    <Square aria-hidden /> Finish
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {(phase === 'prep' || phase === 'speaking' || (phase === 'done' && notes)) && (
        <label className="mt-4 block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Mic className="size-3.5" aria-hidden /> Your notes (stay on this device)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Who / where / when / why…"
          />
        </label>
      )}
    </section>
  )
}
