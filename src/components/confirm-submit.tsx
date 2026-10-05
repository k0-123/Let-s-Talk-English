'use client'

import type { ReactNode } from 'react'

import { SubmitButton } from '@/components/submit-button'
import type { ButtonProps } from '@/components/ui/button'

/** A submit button that asks the browser to confirm before sending the form. */
export const ConfirmSubmit = ({
  message,
  children,
  ...props
}: ButtonProps & { message: string; pendingText?: string; children: ReactNode }) => (
  <SubmitButton
    {...props}
    onClick={(event) => {
      if (!window.confirm(message)) event.preventDefault()
    }}
  >
    {children}
  </SubmitButton>
)
