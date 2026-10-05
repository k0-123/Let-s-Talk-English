import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Flame,
  Mic,
  Repeat2,
  Sparkles,
  Timer,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { getCurrentUser, homePathFor } from '@/lib/auth'

const features = [
  { icon: Repeat2, title: 'Never the same set twice', text: 'Every set you practise is remembered, so you always get fresh questions until you choose to start again.' },
  { icon: Timer, title: 'Real test timing', text: 'Part 2 cue cards with a 1-minute prep and 2-minute speaking timer, just like the exam.' },
  { icon: Mic, title: 'Record and listen back', text: 'Record your answers and hear how you sound. Recordings stay on your device.' },
  { icon: Sparkles, title: 'Instant AI feedback', text: 'Get an estimated band score, strengths, fixes and a stronger version of your own answer.' },
  { icon: Flame, title: 'Streaks and goals', text: 'Set a weekly goal, keep your streak alive, and watch your practice calendar fill up.' },
  { icon: Users, title: 'Your educator, in the loop', text: 'Your educator sees what you practised, assigns sets and marks sets covered in class.' },
]

const faqs = [
  { q: 'Is it free?', a: 'Yes. Create an account and start practising straight away.' },
  { q: 'Which parts of the IELTS Speaking test are covered?', a: 'Part 1 (interview), Part 2 (cue card long turn) and Part 3 (discussion), each with sample answers, vocabulary and tips.' },
  { q: 'Is the AI score my real IELTS score?', a: 'No. It is an estimate to guide your practice. Only an official IELTS examiner can give you a band score.' },
  { q: 'Do you store my voice?', a: 'No. Recordings never leave your device. If you ask for AI feedback, only the text of your answer is sent.' },
  { q: 'I am a teacher. How do I use it with my students?', a: 'Sign up as an educator. Once approved, share your invite code; your students join you and you can follow their practice.' },
]

const MockSetCard = () => (
  <div className="relative mx-auto w-full max-w-sm">
    <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-400/30 via-violet-400/20 to-orange-300/30 blur-2xl" />
    <div className="rounded-2xl border bg-card p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">Part 2 · Cue card</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-streak">
          <Flame className="size-3.5" aria-hidden /> 6-day streak
        </span>
      </div>
      <p className="mt-3 text-lg font-semibold leading-snug">Describe a memorable journey you have made.</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative size-16">
          <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" className="stroke-muted" />
            <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" strokeLinecap="round" className="stroke-primary" strokeDasharray="97.4" strokeDashoffset="34" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">1:18</span>
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-2 rounded-full bg-muted"><div className="h-2 w-2/3 rounded-full bg-primary" /></div>
          <p className="text-xs text-muted-foreground">Speaking… keep going for the full 2 minutes</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border bg-muted/50 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" aria-hidden /> AI feedback</p>
        <div className="mt-2 flex items-end gap-3">
          <span className="text-3xl font-bold tabular-nums">6.5</span>
          <span className="pb-1 text-xs text-muted-foreground">estimated band</span>
        </div>
        <ul className="mt-2 space-y-1 text-xs">
          <li className="flex gap-1.5"><CheckCircle2 className="size-3.5 shrink-0 text-success" aria-hidden /> Clear sequence of events</li>
          <li className="flex gap-1.5"><ArrowRight className="size-3.5 shrink-0 text-primary" aria-hidden /> Add one less common adjective</li>
        </ul>
      </div>
    </div>
  </div>
)

export default async function HomePage() {
  const user = await getCurrentUser()
  if (user) redirect(homePathFor(user))

  return (
    <div>
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_50%_-10%,color-mix(in_srgb,var(--primary)_14%,transparent),transparent)]" />
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-14 sm:py-20 lg:grid-cols-2">
          <div className="space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <BookOpenCheck className="size-3.5 text-primary" aria-hidden /> IELTS Speaking practice
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Speak with confidence <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-indigo-300 dark:to-violet-300">on test day</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground lg:mx-0">
              Fresh question sets every time, exam-style timers, instant feedback, and an educator who can see exactly what you have covered.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg">
                <Link href="/register">
                  Start practising free <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register?role=educator">I&apos;m an educator</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>
          <MockSetCard />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Everything you need to practise speaking</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <f.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 rounded-2xl border bg-card p-6 shadow-sm sm:p-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
            <ol className="mt-6 space-y-5">
              {[
                ['Pick a part', 'Choose Part 1, 2 or 3 and get a few sets you have not done.'],
                ['Speak, record, compare', 'Answer out loud with the timer, then reveal sample answers, vocabulary and tips.'],
                ['Mark it practised', 'It is saved to your history and never offered again in this cycle.'],
              ].map(([title, text], i) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-secondary to-muted p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <ClipboardList className="size-5 text-primary" aria-hidden /> For educators
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                'One invite code for all your students',
                'See who is active, slipping or inactive at a glance',
                'Assign sets and mark sets covered in live sessions',
                'Private notes and CSV export of progress',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden /> {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="size-4" aria-hidden /> Educator accounts are approved by our team.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-center text-2xl font-bold tracking-tight">Questions</h2>
        <div className="mt-6 divide-y rounded-xl border bg-card shadow-sm">
          {faqs.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex items-center justify-between gap-4 font-medium">
                {f.q}
                <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 pt-4">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-10 text-center text-white shadow-lg">
          <h2 className="text-2xl font-bold">Your next practice set is waiting</h2>
          <p className="mt-2 text-indigo-100">It takes less than a minute to sign up.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link href="/register">Create a free account</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
