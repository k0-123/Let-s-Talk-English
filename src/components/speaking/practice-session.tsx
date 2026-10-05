'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Session = { speakingSeconds: number; addSpeaking: (seconds: number) => void }

const PracticeSessionContext = createContext<Session>({ speakingSeconds: 0, addSpeaking: () => {} })

/** Collects speaking time from the timer and recorder on a set page, saved with "Mark as practised". */
export const PracticeSession = ({ children }: { children: ReactNode }) => {
  const [speakingSeconds, setSeconds] = useState(0)
  const addSpeaking = useCallback((seconds: number) => setSeconds((s) => s + Math.max(0, Math.round(seconds))), [])
  const value = useMemo(() => ({ speakingSeconds, addSpeaking }), [speakingSeconds, addSpeaking])
  return <PracticeSessionContext.Provider value={value}>{children}</PracticeSessionContext.Provider>
}

export const usePracticeSession = () => useContext(PracticeSessionContext)
