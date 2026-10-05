import type { Metadata, Viewport } from 'next'
import React from 'react'

import { SiteHeader } from '@/components/site-header'
import { getCurrentUser } from '@/lib/auth'
import { SITE_NAME } from '@/lib/constants'

import './globals.css'

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: 'Practise IELTS Speaking question sets and track your progress with your educator.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1d4ed8',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <SiteHeader user={user} />
        <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">{children}</main>
      </body>
    </html>
  )
}
