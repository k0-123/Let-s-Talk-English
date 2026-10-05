'use client'

import { Check, Copy, RefreshCw, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { regenerateCodeAction } from '@/app/(frontend)/educator/actions'
import { ConfirmSubmit } from '@/components/confirm-submit'
import { Button } from '@/components/ui/button'

export const InviteCodeCard = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false)
  const message = `Join me on Let's Talk English to practise IELTS Speaking. Sign up, open "My educator" and enter the code ${code}.`

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-br from-secondary to-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Your invite code</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em]" data-testid="invite-code">
          {code}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Students enter it on their “My educator” page.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code)
              setCopied(true)
              toast.success('Code copied')
              window.setTimeout(() => setCopied(false), 1500)
            } catch {
              toast.error('Copy is blocked in this browser')
            }
          }}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />} Copy
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            if (navigator.share) {
              await navigator.share({ title: "Let's Talk English", text: message }).catch(() => {})
            } else {
              await navigator.clipboard.writeText(message).catch(() => {})
              toast.success('Invitation copied: paste it into a message')
            }
          }}
        >
          <Share2 aria-hidden /> Share
        </Button>
        <form action={regenerateCodeAction}>
          <ConfirmSubmit
            variant="ghost"
            size="sm"
            pendingText="Creating…"
            message="Create a new code? The old code stops working. Students who already joined stay linked."
          >
            <RefreshCw aria-hidden /> New code
          </ConfirmSubmit>
        </form>
      </div>
    </div>
  )
}
