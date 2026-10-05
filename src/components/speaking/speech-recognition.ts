/** Minimal typing for the Web Speech API (Chrome, Edge, Android, Safari 14.1+). */
export type SpeechRecognitionResultLike = { isFinal: boolean; 0: { transcript: string } }
export type SpeechRecognitionEventLike = { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> }

export interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  start(): void
  stop(): void
  abort(): void
}

type Ctor = new () => SpeechRecognitionLike

export const getSpeechRecognition = (): Ctor | null => {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}
