import Constants from 'expo-constants'
import { useState } from 'react'
import { Linking, View } from 'react-native'

import { useUpdateMe } from '@/api/hooks'
import { useAuth } from '@/auth/AuthProvider'
import { ApiError } from '@/lib/api'
import { WEBSITE_URL } from '@/lib/config'
import { confirm } from '@/lib/device'
import type { ThemePreference } from '@/lib/types'

import { Avatar, Body, Button, Card, ErrorBanner, Heading, Muted, Row, Segmented, TextField } from './ui'

/** Name and email, with the name editable. */
export const ProfileCard = () => {
  const { me } = useAuth()
  const update = useUpdateMe()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(me?.user.name ?? '')
  if (!me) return null

  const save = async () => {
    try {
      await update.mutateAsync({ name: name.trim() })
      setEditing(false)
    } catch {
      // Shown below.
    }
  }

  return (
    <Card>
      <Row gap={14}>
        <Avatar name={me.user.name} size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Body style={{ fontWeight: '700', fontSize: 17 }}>{me.user.name}</Body>
          <Muted>{me.user.email}</Muted>
        </View>
      </Row>
      {editing ? (
        <View style={{ gap: 10 }}>
          {update.error && <ErrorBanner message={update.error instanceof ApiError ? update.error.message : 'Could not save.'} />}
          <TextField label="Your name" value={name} onChangeText={setName} autoComplete="name" />
          <Row>
            <Button title="Save" onPress={save} loading={update.isPending} style={{ flex: 1 }} />
            <Button title="Cancel" variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} />
          </Row>
        </View>
      ) : (
        <Button
          title="Edit name"
          icon="create-outline"
          variant="outline"
          size="sm"
          onPress={() => {
            setName(me.user.name)
            setEditing(true)
          }}
        />
      )}
    </Card>
  )
}

/** System, light or dark. Saved to the account, so the website follows it too. */
export const ThemeCard = () => {
  const { me } = useAuth()
  const update = useUpdateMe()
  const [value, setValue] = useState<ThemePreference>(me?.user.theme ?? 'system')
  return (
    <Card>
      <Heading>Appearance</Heading>
      <Segmented<ThemePreference>
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        value={value}
        onChange={(theme) => {
          setValue(theme)
          update.mutate({ theme })
        }}
      />
    </Card>
  )
}

export const AboutCard = () => (
  <Card>
    <Heading>About</Heading>
    <Row style={{ flexWrap: 'wrap' }} gap={4}>
      <Button title="Privacy" variant="ghost" size="sm" onPress={() => Linking.openURL(`${WEBSITE_URL}/privacy`)} />
      <Button title="Terms" variant="ghost" size="sm" onPress={() => Linking.openURL(`${WEBSITE_URL}/terms`)} />
      <Button title="Open the website" variant="ghost" size="sm" onPress={() => Linking.openURL(WEBSITE_URL)} />
    </Row>
    <Muted style={{ fontSize: 12 }}>Let&apos;s Talk English {Constants.expoConfig?.version ?? ''}</Muted>
  </Card>
)

export const SignOutButton = () => {
  const { signOut } = useAuth()
  const [busy, setBusy] = useState(false)
  return (
    <Button
      title="Log out"
      icon="log-out-outline"
      variant="outline"
      loading={busy}
      testID="sign-out"
      onPress={async () => {
        if (!(await confirm('Log out?', 'You will need your email and password to log in again.', 'Log out'))) return
        setBusy(true)
        await signOut()
      }}
    />
  )
}
