import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { View } from 'react-native'

import { Logo } from '@/components/Logo'
import { Body, Button, Muted, Screen, Title, type IconName } from '@/components/ui'
import { API_URL } from '@/lib/config'
import { useAppTheme } from '@/theme/ThemeProvider'

const features: { icon: IconName; title: string; text: string }[] = [
  { icon: 'sparkles', title: 'Fresh sets every time', text: 'A set you have practised is never offered again.' },
  { icon: 'mic', title: 'Speak, record, listen back', text: 'Part 2 timer and a recorder. Recordings stay on your phone.' },
  { icon: 'people', title: 'Your educator sees your progress', text: 'Join with their invite code and get sets assigned.' },
]

export default function Welcome() {
  const { colors } = useAppTheme()
  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 28, paddingTop: 40, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
      <View style={{ gap: 28 }}>
        <View style={{ gap: 16 }}>
          <Logo size={64} />
          <Title style={{ fontSize: 32 }}>Let&apos;s Talk English</Title>
          <Body style={{ fontSize: 17, color: colors.mutedForeground }}>IELTS Speaking practice, a little every day.</Body>
        </View>
        <View style={{ gap: 18 }}>
          {features.map((f) => (
            <View key={f.title} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={f.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Body style={{ fontWeight: '700' }}>{f.title}</Body>
                <Muted>{f.text}</Muted>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <Button title="Log in" size="lg" onPress={() => router.push('/login')} testID="welcome-login" />
        <Button title="Create an account" size="lg" variant="outline" onPress={() => router.push('/register')} testID="welcome-register" />
        {__DEV__ && <Muted style={{ fontSize: 12, textAlign: 'center' }}>Server: {API_URL}</Muted>}
      </View>
    </Screen>
  )
}
