import { Ionicons } from '@expo/vector-icons'
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio'
import { useState } from 'react'
import { Text, View } from 'react-native'

import { vibrate } from '@/lib/device'
import { formatClock } from '@/lib/format'
import { useAppTheme } from '@/theme/ThemeProvider'

import { Button, ErrorBanner, Muted, Row } from '../ui'

/**
 * Record an answer and listen back. The recording is a file in the app's
 * private storage; it is never uploaded.
 */
export const AnswerRecorder = ({ onRecorded }: { onRecorded: (seconds: number) => void }) => {
  const { colors } = useAppTheme()
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const recorderState = useAudioRecorderState(recorder, 250)
  const [recording, setRecording] = useState<{ uri: string; seconds: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const player = useAudioPlayer(recording?.uri ?? null)
  const playback = useAudioPlayerStatus(player)

  const start = async () => {
    setError(null)
    setBusy(true)
    try {
      const permission = await requestRecordingPermissionsAsync()
      if (!permission.granted) {
        setError('Allow microphone access in your phone settings to record your answer.')
        return
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
      await recorder.prepareToRecordAsync()
      recorder.record()
      setRecording(null)
      vibrate('tap')
    } catch {
      setError('Recording could not start. Close other apps using the microphone and try again.')
    } finally {
      setBusy(false)
    }
  }

  const stop = async () => {
    setBusy(true)
    try {
      const seconds = Math.round(recorder.getStatus().durationMillis / 1000)
      await recorder.stop()
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined)
      if (recorder.uri) {
        setRecording({ uri: recorder.uri, seconds })
        onRecorded(seconds)
      }
      vibrate('success')
    } catch {
      setError('The recording could not be saved. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const togglePlay = () => {
    if (playback.playing) {
      player.pause()
      return
    }
    if (playback.didJustFinish || (playback.duration > 0 && playback.currentTime >= playback.duration - 0.1)) {
      void player.seekTo(0)
    }
    player.play()
  }

  return (
    <View style={{ gap: 10 }}>
      {error && <ErrorBanner message={error} />}
      {recorderState.isRecording ? (
        <Row style={{ justifyContent: 'space-between' }}>
          <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.destructive }} />
            <Text style={{ color: colors.foreground, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
              Recording {formatClock(recorderState.durationMillis / 1000)}
            </Text>
          </View>
          <Button title="Stop" icon="stop" variant="destructive" size="sm" onPress={stop} loading={busy} testID="record-stop" />
        </Row>
      ) : recording ? (
        <Row style={{ flexWrap: 'wrap' }}>
          <Button
            title={playback.playing ? 'Pause' : 'Play'}
            icon={playback.playing ? 'pause' : 'play'}
            variant="secondary"
            size="sm"
            onPress={togglePlay}
            testID="record-play"
          />
          <Muted style={{ fontSize: 13 }}>{formatClock(recording.seconds)} recorded</Muted>
          <Button title="Record again" icon="refresh" variant="ghost" size="sm" onPress={start} loading={busy} />
        </Row>
      ) : (
        <Button title="Record your answer" icon="mic" variant="outline" size="sm" onPress={start} loading={busy} testID="record-start" />
      )}
      <Row gap={6}>
        <Ionicons name="lock-closed" size={12} color={colors.mutedForeground} />
        <Muted style={{ fontSize: 12, flex: 1 }}>Recordings stay on this phone and are never uploaded.</Muted>
      </Row>
    </View>
  )
}
