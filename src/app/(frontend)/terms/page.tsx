import type { Metadata } from 'next'

import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = { title: 'Terms' }

// Draft text. The client must review it before launch (docs/status.md).
export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="October 2026">
      <section>
        <h2>Using the service</h2>
        <p>Let&apos;s Talk English is a practice tool for the IELTS Speaking test. Keep your password private and use the service for your own practice or, as an educator, to support your students.</p>
      </section>
      <section>
        <h2>Content</h2>
        <p>The question sets, sample answers, vocabulary and tips belong to Let&apos;s Talk English. You may use them for your own practice but must not copy, scrape or republish them.</p>
      </section>
      <section>
        <h2>Feedback and scores</h2>
        <p>AI feedback and estimated bands are a guide only. They are not official IELTS results, and we cannot guarantee any test outcome.</p>
      </section>
      <section>
        <h2>Educator accounts</h2>
        <p>Educator accounts are approved by us and may be suspended if they are misused.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions about these terms: [CONTACT_EMAIL].</p>
      </section>
    </LegalPage>
  )
}
