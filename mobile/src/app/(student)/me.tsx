import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { useStartCycle, useUpdateMe } from '@/api/hooks'
import { useAuth } from '@/auth/AuthProvider'
import { AboutCard, ProfileCard, SignOutButton, ThemeCard } from '@/components/account'
import { Body, Button, Card, ErrorBanner, Heading, Muted, Row, Screen, SuccessBanner, Title } from '@/components/ui'
import { ApiError } from '@/lib/api'
import { confirm, vibrate } from '@/lib/device'
import { useAppTheme } from '@/theme/ThemeProvider'

const Stepper = ({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) => {
  const { colors } = useAppTheme()
  const button = (icon: 'remove' | 'add', next: number, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={next < min || next > max}
      onPress={() => {
        vibrate('tap')
        onChange(next)
      }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.muted : colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: next < min || next > max ? 0.4 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={colors.foreground} />
    </Pressable>
  )
  return (
    <Row gap={16} accessibilityRole="adjustable" accessibilityValue={{ min, max, now: value }}>
      {button('remove', value - 1, 'Fewer sets')}
      <Text style={{ fontSize: 28, fontWeight: '800', color: colors.foreground, minWidth: 44, textAlign: 'center' }}>{value}</Text>
      {button('add', value + 1, 'More sets')}
    </Row>
  )
}

export default function Me() {
  const { me } = useAuth()
  const update = useUpdateMe()
  const startCycle = useStartCycle()
  const [goal, setGoal] = useState(me?.user.weeklyGoal ?? 5)
  const [cycleMessage, setCycleMessage] = useState<string | null>(null)
  if (!me) return null

  const newCycle = async () => {
    const ok = await confirm(
      'Start a new practice cycle?',
      'Every set becomes new again in every part. Your history is kept, marked with its cycle number.',
      'Start new cycle',
    )
    if (!ok) return
    try {
      const { cycle } = await startCycle.mutateAsync()
      vibrate('success')
      setCycleMessage(`Cycle ${cycle} started. Every set is new again.`)
    } catch {
      // Shown below.
    }
  }

  return (
    <Screen>
      <Title>Me</Title>
      <ProfileCard />

      <Card>
        <Heading>My educator</Heading>
        {me.educatorName ? (
          <Body>
            You are linked to <Body style={{ fontWeight: '700' }}>{me.educatorName}</Body>. They can see your practice and assign you sets.
          </Body>
        ) : (
          <Muted>You haven’t joined an educator yet. Ask your teacher for their invite code.</Muted>
        )}
        <Button
          title={me.educatorName ? 'Change educator' : 'Enter invite code'}
          icon="key-outline"
          variant={me.educatorName ? 'outline' : 'primary'}
          size="sm"
          onPress={() => router.push('/join')}
          testID="open-join"
        />
      </Card>

      <Card>
        <Heading>Weekly goal</Heading>
        <Muted>How many sets do you want to practise each week?</Muted>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Stepper value={goal} onChange={setGoal} min={1} max={50} />
          {goal !== me.user.weeklyGoal && <Button title="Save goal" size="sm" onPress={() => update.mutate({ weeklyGoal: goal })} loading={update.isPending} />}
        </Row>
        {update.error && <ErrorBanner message={update.error instanceof ApiError ? update.error.message : 'Could not save.'} />}
      </Card>

      <ThemeCard />

      <Card>
        <Heading>Practice cycle {me.user.cycle}</Heading>
        <Muted>Preparing for another test? A new cycle makes every set new again. Your history stays.</Muted>
        {cycleMessage && <SuccessBanner message={cycleMessage} />}
        {startCycle.error && <ErrorBanner message={startCycle.error instanceof ApiError ? startCycle.error.message : 'Could not start a new cycle.'} />}
        <Button title="Start a new cycle" icon="refresh" variant="outline" size="sm" onPress={newCycle} loading={startCycle.isPending} />
      </Card>

      {me.ai.enabled && (
        <Card>
          <Heading>AI feedback</Heading>
          <Muted>
            {me.ai.usedToday} of {me.ai.limit} requests used today. Only the text of your answer is sent, never your recording.
          </Muted>
        </Card>
      )}

      <AboutCard />
      <View style={{ paddingBottom: 8 }}>
        <SignOutButton />
      </View>
    </Screen>
  )
}
