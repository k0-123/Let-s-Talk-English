'use client'

import { Toaster as Sonner } from 'sonner'

export const Toaster = () => (
  <Sonner
    position="top-center"
    richColors
    closeButton
    toastOptions={{ className: 'font-sans' }}
    theme="system"
  />
)
