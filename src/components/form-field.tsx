import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'

export const FormField = ({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: ReactNode
  children: ReactNode
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    {error && (
      <p id={`${id}-error`} className="text-sm text-destructive">
        {error}
      </p>
    )}
  </div>
)
