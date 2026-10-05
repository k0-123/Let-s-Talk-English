import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'

import { FormScreen } from '@/components/FormScreen'
import { Body, Button, Card, Muted, Title } from '@/components/ui'
import { useAppTheme } from '@/theme/ThemeProvider'

export default function CheckEmail() {
  const { colors } = useAppTheme()
  const { role, email } = useLocalSearchParams<{ role?: string; email?: string }>()
  const educator = role === 'educator'
  return (
    <FormScreen>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="mail-unread" size={30} color={colors.primary} />
      </View>
      <Title>Check your email</Title>
      <Body>
        We sent a confirmation link to {email ? <Body style={{ fontWeight: '700' }}>{email}</Body> : 'your email address'}. Open it on this
        phone or on a computer to confirm your account.
      </Body>
      {educator ? (
        <Card>
          <Body style={{ fontWeight: '700' }}>Then wait for approval</Body>
          <Muted>The admin checks every educator account. We will email you when yours is approved, and then you can log in.</Muted>
        </Card>
      ) : (
        <Muted>Once you have confirmed, come back and log in.</Muted>
      )}
      <Button title="Go to log in" size="lg" onPress={() => router.replace('/login')} />
      <Muted style={{ fontSize: 13 }}>No email after a few minutes? Check your spam folder, or use &quot;Didn&apos;t get the email?&quot; on the website&apos;s log-in page.</Muted>
    </FormScreen>
  )
}
