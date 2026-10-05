/** Short beep and vibration for timer changes. Silently does nothing where unsupported. */
let audioContext: AudioContext | null = null

export const beep = (frequency = 880, durationMs = 180) => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    audioContext ??= new Ctx()
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.15, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + durationMs / 1000)
    osc.connect(gain).connect(audioContext.destination)
    osc.start()
    osc.stop(audioContext.currentTime + durationMs / 1000)
  } catch {
    // Audio is a nice-to-have.
  }
  try {
    navigator.vibrate?.(80)
  } catch {
    // Not supported.
  }
}

export const formatClock = (seconds: number) => {
  const s = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
