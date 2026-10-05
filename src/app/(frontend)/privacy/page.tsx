import type { Metadata } from 'next'

import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = { title: 'Privacy' }

// Draft text. The client must review it before launch (docs/status.md).
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="October 2026">
      <p>Let&apos;s Talk English helps students practise IELTS Speaking and lets their educators follow that practice. This page explains what we store and why.</p>
      <section>
        <h2>What we store</h2>
        <ul>
          <li>Your name, email address and password (stored only as a secure hash).</li>
          <li>Your role, your educator (if you join one) and your settings, such as your weekly goal and theme.</li>
          <li>Your practice history: which sets you practised, when, and any confidence rating or speaking time you saved.</li>
          <li>If you ask for AI feedback, the text of your answer and the feedback you received.</li>
        </ul>
      </section>
      <section>
        <h2>What we do not store</h2>
        <p>Audio recordings never leave your device. We do not sell your data or show advertising.</p>
      </section>
      <section>
        <h2>Who can see your data</h2>
        <ul>
          <li>You can see your own history and feedback.</li>
          <li>Your educator can see your practice history and AI feedback, and keeps private notes about your progress.</li>
          <li>The site administrator can see all accounts in order to run the service.</li>
        </ul>
      </section>
      <section>
        <h2>AI feedback</h2>
        <p>When you ask for feedback, the question and your answer text are sent to Anthropic&apos;s API, which generates the feedback. Nothing else about you is sent.</p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>You can change your details on the Account page. To delete your account and its data, contact us at [CONTACT_EMAIL].</p>
      </section>
    </LegalPage>
  )
}
