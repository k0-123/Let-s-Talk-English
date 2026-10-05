import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import React from 'react'

import { MobileTabBar } from '@/components/shell/nav-links'
import { SiteFooter } from '@/components/shell/site-footer'
import { Toaster } from '@/components/shell/toaster'
import { SiteHeader } from '@/components/site-header'
import { getCurrentUser } from '@/lib/auth'
import { SITE_NAME } from '@/lib/constants'
import { THEME_COOKIE, parseTheme, themeScript } from '@/lib/theme'

import './globals.css'

// Every page depends on who is logged in, so nothing is prerendered at build time.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: 'Practise IELTS Speaking question sets and track your progress with your educator.',
  robots: { index: false, follow: false },
  appleWebApp: { title: SITE_NAME, capable: true, statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f1e' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value ?? user?.theme)

  return (
    <html lang="en" className={theme === 'dark' ? 'dark' : undefined} suppressHydrationWarning>
      <head>
        {/* Applies the saved or device theme before paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">
          Skip to content
        </a>
        <SiteHeader user={user} />
        <main id="main" className={user ? 'mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:pb-12 sm:pt-8' : 'w-full'}>
          {children}
        </main>
        {user ? <MobileTabBar user={user} /> : <SiteFooter />}
        <Toaster />
      </body>
    </html>
  )
}
