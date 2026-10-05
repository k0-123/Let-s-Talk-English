'use client'

import { useFormStatus } from 'react-dom'

import { Button, type ButtonProps } from '@/components/ui/button'

/** A submit button that disables itself while its form is being sent. */
export const SubmitButton = ({ children, pendingText, ...props }: ButtonProps & { pendingText?: string }) => {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending ? (pendingText ?? 'Please wait…') : children}
    </Button>
  )
}
