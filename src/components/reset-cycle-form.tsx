import { startNewCycleAction } from '@/app/(frontend)/student-actions'
import { ConfirmSubmit } from '@/components/confirm-submit'

export const ResetCycleForm = ({ variant = 'outline' }: { variant?: 'outline' | 'default' }) => (
  <form action={startNewCycleAction}>
    <ConfirmSubmit
      variant={variant}
      pendingText="Starting…"
      message="Start a new practice cycle? Every set becomes new again. Your history and your educator's view are kept."
    >
      Start a new practice cycle
    </ConfirmSubmit>
  </form>
)
