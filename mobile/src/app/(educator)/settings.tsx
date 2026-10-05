import { View } from 'react-native'

import { useAuth } from '@/auth/AuthProvider'
import { AboutCard, ProfileCard, SignOutButton, ThemeCard } from '@/components/account'
import { InviteCodeCard } from '@/components/InviteCodeCard'
import { Screen, Title } from '@/components/ui'

export default function Settings() {
  const { me } = useAuth()
  return (
    <Screen>
      <Title>Me</Title>
      <ProfileCard />
      <InviteCodeCard code={me?.user.inviteCode ?? null} allowNew />
      <ThemeCard />
      <AboutCard />
      <View style={{ paddingBottom: 8 }}>
        <SignOutButton />
      </View>
    </Screen>
  )
}
