import { useState } from 'react'
import { Text, View } from 'react-native'

import { useRegenerateCode } from '@/api/hooks'
import { WEBSITE_URL } from '@/lib/config'
import { confirm, copyText, shareText, vibrate } from '@/lib/device'
import { useAppTheme } from '@/theme/ThemeProvider'

import { Button, Card, Heading, Muted, Row } from './ui'

export const inviteMessage = (code: string) =>
  `Join my class on Let's Talk English. Install the app (or open ${WEBSITE_URL}/join), then enter my invite code: ${code}`

/** The educator's invite code, with Share and Copy, and optionally "Get a new code". */
export const InviteCodeCard = ({ code, allowNew = false }: { code: string | null; allowNew?: boolean }) => {
  const { colors } = useAppTheme()
  const regenerate = useRegenerateCode()
  const [status, setStatus] = useState<string | null>(null)
  if (!code) return null

  const flash = (message: string) => {
    setStatus(message)
    setTimeout(() => setStatus(null), 2000)
  }

  return (
    <Card testID="invite-code-card">
      <Heading>Your invite code</Heading>
      <Muted>Students enter this code in the app or on the website to join you.</Muted>
      <View style={{ backgroundColor: colors.secondary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
        <Text selectable testID="invite-code" style={{ fontSize: 30, fontWeight: '800', letterSpacing: 6, color: colors.secondaryForeground, fontVariant: ['tabular-nums'] }}>
          {code}
        </Text>
      </View>
      <Row>
        <Button
          title="Share"
          icon="share-outline"
          size="sm"
          style={{ flex: 1 }}
          onPress={async () => {
            const result = await shareText(inviteMessage(code))
            if (result === 'copied') flash('Invite copied. Paste it into a message.')
          }}
        />
        <Button
          title="Copy code"
          icon="copy-outline"
          variant="outline"
          size="sm"
          style={{ flex: 1 }}
          onPress={async () => {
            if (await copyText(code)) {
              vibrate('tap')
              flash('Code copied.')
            }
          }}
        />
      </Row>
      {status && <Muted style={{ textAlign: 'center' }}>{status}</Muted>}
      {allowNew && (
        <Button
          title="Get a new code"
          icon="refresh"
          variant="ghost"
          size="sm"
          loading={regenerate.isPending}
          onPress={async () => {
            const ok = await confirm(
              'Get a new invite code?',
              'The old code stops working for new students. Students who already joined stay linked to you.',
              'Get new code',
            )
            if (ok) regenerate.mutate(undefined, { onSuccess: () => flash('New code ready.') })
          }}
        />
      )}
    </Card>
  )
}
