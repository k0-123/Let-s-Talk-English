import { CheckCircle2, Circle, X } from 'lucide-react'
import Link from 'next/link'

import { dismissOnboardingAction } from '@/app/(frontend)/account/actions'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export type OnboardingStep = { label: string; done: boolean; href?: string }

/** "Getting started" card. Hidden once every step is done or the user dismisses it. */
export const OnboardingChecklist = ({ title, steps }: { title: string; steps: OnboardingStep[] }) => {
  const done = steps.filter((s) => s.done).length
  if (done === steps.length) return null
  return (
    <section aria-label="Getting started" className="relative rounded-xl border border-primary/25 bg-gradient-to-br from-secondary to-card p-5 shadow-sm">
      <form action={dismissOnboardingAction} className="absolute right-3 top-3">
        <button type="submit" aria-label="Hide getting started" className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <X className="size-4" />
        </button>
      </form>
      <h2 className="pr-8 font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {done} of {steps.length} done
      </p>
      <Progress value={done} max={steps.length} label="Getting started progress" className="mt-3" />
      <ul className="mt-4 space-y-2">
        {steps.map((step) => {
          const content = (
            <>
              {step.done ? (
                <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className={cn('text-sm', step.done && 'text-muted-foreground line-through')}>{step.label}</span>
              <span className="sr-only">{step.done ? '(done)' : '(to do)'}</span>
            </>
          )
          return (
            <li key={step.label}>
              {step.href && !step.done ? (
                <Link href={step.href} className="flex items-center gap-3 rounded-lg p-1 font-medium hover:text-primary">
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 p-1">{content}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
