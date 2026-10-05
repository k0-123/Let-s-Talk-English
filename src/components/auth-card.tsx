import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const AuthCard = ({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) => (
  <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
    {footer && <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>}
  </div>
)
