import { Ionicons } from '@expo/vector-icons'
import { useState, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

import { ApiError } from '@/lib/api'
import { useAppTheme } from '@/theme/ThemeProvider'

import { Button, Card, EmptyState, Heading, Loading, Muted, Row } from './ui'

/** A titled block on a screen, with an optional link on the right. */
export const Section = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <View style={{ gap: 10 }}>
    <Row style={{ justifyContent: 'space-between' }}>
      <Heading>{title}</Heading>
      {action}
    </Row>
    {children}
  </View>
)

/** A card whose body opens on tap (sample answers, vocabulary, tips). */
export const Disclosure = ({ title, icon, children, initiallyOpen = false, testID }: { title: string; icon?: keyof typeof Ionicons.glyphMap; children: ReactNode; initiallyOpen?: boolean; testID?: string }) => {
  const { colors } = useAppTheme()
  const [open, setOpen] = useState(initiallyOpen)
  return (
    <Card style={{ paddingVertical: 4, gap: 0 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        testID={testID}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}
      >
        {icon && <Ionicons name={icon} size={18} color={colors.primary} />}
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colors.foreground }}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
      </Pressable>
      {open && <View style={{ paddingBottom: 12, gap: 10 }}>{children}</View>}
    </Card>
  )
}

/** Loading spinner, or a friendly error with "Try again", for a whole screen's data. */
export const QueryState = ({ isPending, error, onRetry }: { isPending: boolean; error: unknown; onRetry: () => void }) => {
  if (isPending) return <Loading />
  const message = error instanceof ApiError ? error.message : 'Something went wrong while loading.'
  return (
    <View style={{ padding: 16 }}>
      <EmptyState icon="cloud-offline-outline" title="Could not load this" message={message} action={<Button title="Try again" icon="refresh" onPress={onRetry} />} />
    </View>
  )
}

export const LoadMore = ({ hasMore, loading, onPress }: { hasMore: boolean; loading: boolean; onPress: () => void }) =>
  hasMore ? <Button title="Show more" variant="outline" onPress={onPress} loading={loading} /> : null

export const Hint = ({ icon = 'information-circle-outline', children }: { icon?: keyof typeof Ionicons.glyphMap; children: ReactNode }) => {
  const { colors } = useAppTheme()
  return (
    <Row gap={6} style={{ alignItems: 'flex-start' }}>
      <Ionicons name={icon} size={14} color={colors.mutedForeground} style={{ marginTop: 3 }} />
      <Muted style={{ flex: 1, fontSize: 13 }}>{children}</Muted>
    </Row>
  )
}
