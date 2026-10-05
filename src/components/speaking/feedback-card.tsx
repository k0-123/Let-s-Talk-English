'use client'

import { Check, Copy, Lightbulb, Sparkles, ThumbsUp, Wrench } from 'lucide-react'
import { useState } from 'react'

import type { FeedbackResult } from '@/lib/ai-feedback-schema'
import { cn } from '@/lib/utils'

const criteria: { key: 'fluencyCoherence' | 'lexicalResource' | 'grammaticalRange'; label: string }[] = [
  { key: 'fluencyCoherence', label: 'Fluency and coherence' },
  { key: 'lexicalResource', label: 'Vocabulary' },
  { key: 'grammaticalRange', label: 'Grammar' },
]

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        } catch {
          // Clipboard blocked: nothing to do.
        }
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-accent"
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/** Claude's feedback on one answer. The band is an estimate, and the card says so. */
export const FeedbackCard = ({ result, className }: { result: FeedbackResult; className?: string }) => (
  <div className={cn('space-y-4 rounded-xl border bg-card p-4 shadow-sm', className)} data-testid="feedback-card">
    <div className="flex items-center gap-4">
      <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow">
        <span className="text-2xl font-bold leading-none tabular-nums">{result.estimatedBand.toFixed(1)}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-indigo-100">band</span>
      </div>
      <div>
        <p className="flex items-center gap-1.5 font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden /> AI feedback
        </p>
        <p className="text-xs text-muted-foreground">An estimate to guide your practice, not an official IELTS score.</p>
      </div>
    </div>

    <dl className="space-y-3">
      {criteria.map((c) => {
        const item = result[c.key]
        return (
          <div key={c.key}>
            <div className="flex items-center justify-between text-sm">
              <dt className="font-medium">{c.label}</dt>
              <dd className="font-semibold tabular-nums">{item.score.toFixed(1)}</dd>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-chart-0" role="presentation">
              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, (item.score / 9) * 100)}%` }} />
            </div>
            <dd className="mt-1 text-sm text-muted-foreground">{item.comment}</dd>
          </div>
        )
      })}
      <div>
        <dt className="text-sm font-medium">Pronunciation</dt>
        <dd className="mt-1 text-sm text-muted-foreground">{result.pronunciationNote}</dd>
      </div>
    </dl>

    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-500/10">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          <ThumbsUp className="size-4" aria-hidden /> What went well
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {result.strengths.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300">
          <Wrench className="size-4" aria-hidden /> To improve
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {result.improvements.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </div>

    <div className="rounded-lg border bg-muted/40 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">A stronger version of your answer</p>
        <CopyButton text={result.improvedAnswer} />
      </div>
      <p className="mt-1 text-sm leading-relaxed">{result.improvedAnswer}</p>
    </div>

    {result.usefulPhrases.length > 0 && (
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Lightbulb className="size-4 text-primary" aria-hidden /> Phrases to learn
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {result.usefulPhrases.map((p) => (
            <li key={p} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {p}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)
