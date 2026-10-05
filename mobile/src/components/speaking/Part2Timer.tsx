import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Text, TextInput, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

import { vibrate } from '@/lib/device'
import { formatClock } from '@/lib/format'
import {
  finish,
  initialTimer,
  startPrep,
  startSpeaking,
  tick,
  timerProgress,
  type TimerEvent,
  type TimerState,
} from '@/lib/part2-timer'
import { useAppTheme } from '@/theme/ThemeProvider'

import { Button, Card, Heading, Muted, Row } from '../ui'

const KEEP_AWAKE_TAG = 'part2-timer'

const Ring = ({ progress, color, track, children }: { progress: number; color: string; track: string; children: React.ReactNode }) => {
  const r = 15.5
  const c = 2 * Math.PI * r
  return (
    <View style={{ width: 168, height: 168, alignSelf: 'center' }}>
      <Svg width={168} height={168} viewBox="0 0 36 36" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={18} cy={18} r={r} fill="none" strokeWidth={2.5} stroke={track} />
        <Circle
          cx={18}
          cy={18}
          r={r}
          fill="none"
          strokeWidth={2.5}
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - progress)}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  )
}

/**
 * IELTS Part 2: one minute to prepare (with a notes box), then up to two
 * minutes to speak. Vibrates when it's time to speak, at 30 seconds left and
 * at the end, and keeps the screen on while it runs.
 */
export const Part2Timer = ({ onSpoken }: { onSpoken: (seconds: number) => void }) => {
  const { colors } = useAppTheme()
  const [state, setState] = useState<TimerState>(initialTimer)
  const [notes, setNotes] = useState('')
  const current = useRef(state)
  const onSpokenRef = useRef(onSpoken)
  const running = state.phase === 'prep' || state.phase === 'speaking'

  useEffect(() => {
    onSpokenRef.current = onSpoken
  }, [onSpoken])

  const update = (next: TimerState, event: TimerEvent = null) => {
    current.current = next
    setState(next)
    if (event === 'start-speaking') {
      vibrate('warning')
      AccessibilityInfo.announceForAccessibility('Start speaking now. You have two minutes.')
    } else if (event === 'thirty-left') {
      vibrate('tap')
      AccessibilityInfo.announceForAccessibility('30 seconds left.')
    } else if (event === 'finished') {
      vibrate('success')
      AccessibilityInfo.announceForAccessibility('Time is up.')
      onSpokenRef.current(next.spoken)
    }
  }

  useEffect(() => {
    if (!running) return
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined)
    const id = setInterval(() => {
      const { state: next, event } = tick(current.current)
      update(next, event)
    }, 1000)
    return () => {
      clearInterval(id)
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined)
    }
    // `update` only touches refs and state setters, so the interval depends on `running` alone.
  }, [running])

  const stopEarly = () => {
    const done = finish(current.current)
    current.current = done
    setState(done)
    vibrate('success')
    onSpokenRef.current(done.spoken)
  }

  const phaseLabel = { idle: 'Ready when you are', prep: 'Prepare', speaking: 'Speak', done: 'Finished' }[state.phase]
  const ringColor = state.phase === 'speaking' ? (state.remaining <= 30 ? colors.warning : colors.success) : colors.primary

  return (
    <Card testID="part2-timer" style={{ gap: 14 }}>
      <View style={{ gap: 2 }}>
        <Heading>Part 2 timer</Heading>
        <Muted>One minute to make notes, then speak for up to two minutes.</Muted>
      </View>

      <Ring progress={timerProgress(state)} color={ringColor} track={colors.chart[0]}>
        <Text accessibilityLiveRegion="polite" style={{ fontSize: 13, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 }}>
          {phaseLabel}
        </Text>
        <Text testID="part2-clock" style={{ fontSize: 40, fontWeight: '800', color: colors.foreground, fontVariant: ['tabular-nums'] }}>
          {state.phase === 'done' ? formatClock(state.spoken) : formatClock(state.remaining)}
        </Text>
        {state.phase === 'done' && <Muted style={{ fontSize: 12 }}>spoken</Muted>}
      </Ring>

      {state.phase === 'speaking' && state.spoken < 90 && (
        <Muted style={{ textAlign: 'center' }}>Keep going: aim for at least a minute and a half.</Muted>
      )}
      {state.phase === 'done' && (
        <Muted style={{ textAlign: 'center' }}>
          {state.spoken >= 90 ? 'Well done. That is a full Part 2 answer.' : 'Try to speak for longer next time: at least a minute and a half.'}
        </Muted>
      )}

      {state.phase !== 'idle' && (
        <TextInput
          accessibilityLabel="Your notes"
          placeholder="Notes: key words, an example, how you felt…"
          placeholderTextColor={colors.mutedForeground}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{
            minHeight: 90,
            borderWidth: 1,
            borderColor: colors.input,
            borderRadius: 12,
            padding: 12,
            color: colors.foreground,
            backgroundColor: colors.background,
            textAlignVertical: 'top',
            fontSize: 15,
          }}
        />
      )}

      <Row style={{ flexWrap: 'wrap' }}>
        {state.phase === 'idle' && <Button title="Start preparing" icon="play" onPress={() => update(startPrep())} style={{ flex: 1 }} />}
        {state.phase === 'prep' && (
          <Button title="Start speaking now" icon="mic" onPress={() => update(startSpeaking(current.current))} style={{ flex: 1 }} />
        )}
        {state.phase === 'speaking' && <Button title="Stop" icon="stop" variant="outline" onPress={stopEarly} style={{ flex: 1 }} />}
        {state.phase === 'done' && (
          <Button
            title="Start again"
            icon="refresh"
            variant="outline"
            onPress={() => {
              setNotes('')
              update(startPrep())
            }}
            style={{ flex: 1 }}
          />
        )}
      </Row>
    </Card>
  )
}
