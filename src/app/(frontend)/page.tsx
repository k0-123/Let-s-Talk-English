import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser, homePathFor } from '@/lib/auth'

const steps = [
  { title: 'Pick a category', text: 'Choose IELTS Speaking Part 1, 2 or 3 and get a few new question sets.' },
  { title: 'Practise', text: 'Answer the questions out loud, then reveal sample answers, vocabulary and tips.' },
  { title: 'Never repeat', text: 'Mark a set as practised. It is saved to your history and not shown to you again.' },
]

export default async function HomePage() {
  const user = await getCurrentUser()
  if (user) redirect(homePathFor(user))

  return (
    <div className="space-y-10">
      <section className="space-y-4 pt-4 text-center sm:pt-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Practise IELTS Speaking, one set at a time</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Fresh question sets every time you practise, and an educator who can see exactly what you have
          covered.
        </p>
        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/register">Start practising</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/register?role=educator">I&apos;m an educator</Link>
          </Button>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <Card key={step.title}>
            <CardHeader>
              <span className="text-sm font-semibold text-primary">Step {index + 1}</span>
              <CardTitle>{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{step.text}</CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
