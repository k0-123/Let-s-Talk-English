'use client'

import { Download, Keyboard, Loader2, Mic, RotateCcw, Sparkles, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { getFeedbackAction } from '@/app/(frontend)/student-actions'
import { Button } from '@/components/ui/button'
import type { FeedbackResult } from '@/lib/ai-feedback-schema'
import { cn } from '@/lib/utils'

import { formatClock } from './audio-cues'
import { FeedbackCard } from './feedback-card'
import { usePracticeSession } from './practice-session'
import { getSpeechRecognition, type SpeechRecognitionLike } from './speech-recognition'

const MIN_CHARS = 20

type Mode = 'closed' | 'recording' | 'review' | 'typing'

const pickMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return undefined
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported(t))
}

/**
 * Practice tools under one question: record and listen back (audio never
 * leaves the device), a live transcript where the browser supports it, a
 * typed answer otherwise, and AI feedback on the text.
 */
export const QuestionPractice = ({
  setId,
  questionIndex,
  aiEnabled,
}: {
  setId: string
  questionIndex: number
  aiEnabled: boolean
}) => {
  const { addSpeaking } = usePracticeSession()
  const [mode, setMode] = useState<Mode>('closed')
  const [elapsed, setElapsed] = useState(0)
  const [level, setLevel] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [transcribing, setTranscribing] = useState(false)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const recordingRef = useRef(false)
  const startedAtRef = useRef(0)

  const cleanupStream = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (timerRef.current) window.clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    void audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
  }, [])

  useEffect(
    () => () => {
      recordingRef.current = false
      recognitionRef.current?.abort()
      cleanupStream()
    },
    [cleanupStream],
  )

  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    },
    [audioUrl],
  )

  const startTranscript = () => {
    const Recognition = getSpeechRecognition()
    if (!Recognition) return
    const recognition = new Recognition()
    recognition.lang = 'en-GB'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalText += result[0].transcript
        else interimText += result[0].transcript
      }
      if (finalText) setAnswer((a) => `${a} ${finalText}`.replace(/\s+/g, ' ').trim())
      setInterim(interimText)
    }
    // Browsers stop listening after a pause; carry on while still recording.
    recognition.onend = () => {
      if (recordingRef.current) {
        try {
          recognition.start()
        } catch {
          // Already started.
        }
      } else {
        setTranscribing(false)
        setInterim('')
      }
    }
    recognition.onerror = () => {}
    try {
      recognition.start()
      recognitionRef.current = recognition
      setTranscribing(true)
    } catch {
      setTranscribing(false)
    }
  }

  const start = async () => {
    setError(null)
    setFeedback(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Recording is not supported in this browser. You can type your answer instead.')
      setMode('typing')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        setAudioUrl((old) => {
          if (old) URL.revokeObjectURL(old)
          return URL.createObjectURL(blob)
        })
      }
      recorder.start()
      recorderRef.current = recorder

      // Input level meter.
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.fftSize)
      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (const v of data) sum += ((v - 128) / 128) ** 2
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()

      startedAtRef.current = Date.now()
      setElapsed(0)
      timerRef.current = window.setInterval(() => setElapsed((Date.now() - startedAtRef.current) / 1000), 250)
      recordingRef.current = true
      setAnswer('')
      setMode('recording')
      startTranscript()
    } catch (e) {
      cleanupStream()
      const denied = e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')
      setError(
        denied
          ? 'Microphone access is blocked. Allow it in your browser settings, or type your answer instead.'
          : 'Could not start the microphone. You can type your answer instead.',
      )
    }
  }

  const stop = () => {
    recordingRef.current = false
    recognitionRef.current?.stop()
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    addSpeaking((Date.now() - startedAtRef.current) / 1000)
    cleanupStream()
    setLevel(0)
    setMode('review')
  }

  const askForFeedback = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getFeedbackAction({ setId, questionIndex, answerText: answer })
      if (result.error || !result.feedback) {
        setError(result.error ?? 'Feedback could not be loaded.')
      } else {
        setFeedback(result.feedback.result)
        if (result.limit !== undefined && result.usedToday !== undefined) {
          toast.success(`Feedback ready · ${Math.max(0, result.limit - result.usedToday)} left today`)
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const supportsTranscript = typeof window !== 'undefined' && Boolean(getSpeechRecognition())

  if (mode === 'closed') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={start}>
          <Mic aria-hidden /> Record my answer
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setMode('typing')}>
          <Keyboard aria-hidden /> Type it
        </Button>
        {error && <p className="w-full text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
      {mode === 'recording' && (
        <div className="flex items-center gap-3">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-60" />
            <span className="relative inline-flex size-3 rounded-full bg-destructive" />
          </span>
          <span className="font-mono text-sm tabular-nums" aria-live="off">
            {formatClock(elapsed)}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-chart-0" aria-hidden>
            <div className="h-2 rounded-full bg-primary transition-[width] duration-75" style={{ width: `${Math.round(level * 100)}%` }} />
          </div>
          <Button type="button" size="sm" variant="destructive" onClick={stop}>
            <Square aria-hidden /> Stop
          </Button>
        </div>
      )}

      {mode === 'review' && audioUrl && (
        <div className="flex flex-wrap items-center gap-2">
          <audio controls src={audioUrl} className="h-10 w-full max-w-sm" />
          <Button type="button" size="sm" variant="ghost" onClick={start}>
            <RotateCcw aria-hidden /> Record again
          </Button>
          <Button asChild size="sm" variant="ghost">
            <a href={audioUrl} download={`answer-${questionIndex + 1}.webm`}>
              <Download aria-hidden /> Save
            </a>
          </Button>
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">
          {mode === 'recording'
            ? supportsTranscript
              ? 'Live transcript'
              : 'Your browser cannot transcribe: type your answer after recording'
            : 'Your answer (you can edit it)'}
          {transcribing && mode === 'recording' && <span className="ml-1 text-primary">· listening</span>}
        </span>
        <textarea
          value={mode === 'recording' && interim ? `${answer} ${interim}`.trim() : answer}
          onChange={(e) => setAnswer(e.target.value)}
          readOnly={mode === 'recording'}
          rows={4}
          maxLength={2000}
          placeholder={mode === 'typing' ? 'Type what you would say…' : 'Your words will appear here as you speak.'}
          className="w-full rounded-lg border border-input bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {mode !== 'recording' && (
        <div className="flex flex-wrap items-center gap-2">
          {aiEnabled ? (
            <Button type="button" size="sm" onClick={askForFeedback} disabled={loading || answer.trim().length < MIN_CHARS}>
              {loading ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
              {loading ? 'Getting feedback…' : 'Get AI feedback'}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">Compare your answer with the sample answer above.</p>
          )}
          {aiEnabled && answer.trim().length < MIN_CHARS && (
            <span className="text-xs text-muted-foreground">Say or type at least a full sentence first.</span>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn('ml-auto')}
            onClick={() => {
              setMode('closed')
              setFeedback(null)
              setError(null)
            }}
          >
            Close
          </Button>
        </div>
      )}

      {feedback && <FeedbackCard result={feedback} />}
    </div>
  )
}
