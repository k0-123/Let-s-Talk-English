import type { ReactNode } from 'react'

export const LegalPage = ({ title, updated, children }: { title: string; updated: string; children: ReactNode }) => (
  <article className="mx-auto max-w-2xl px-4 py-12">
    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
    <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
    <div className="mt-8 space-y-6 text-[15px] leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      {children}
    </div>
  </article>
)
