import { router } from 'expo-router'
import { useState } from 'react'

import { useJoinEducator } from '@/api/hooks'
import { useAuth } from '@/auth/AuthProvider'
import { FormScreen } from '@/components/FormScreen'
import { Button, ErrorBanner, Muted, SuccessBanner, TextField, Title } from '@/components/ui'
import { ApiError } from '@/lib/api'
import { vibrate } from '@/lib/device'

export default function Join() {
  const { me } = useAuth()
  const join = useJoinEducator()
  const [code, setCode] = useState('')
  const [joined, setJoined] = useState<string | null>(null)

  const submit = async () => {
    try {
      const { educatorName } = await join.mutateAsync(code)
      vibrate('success')
      setJoined(educatorName)
    } catch {
      // Shown below.
    }
  }

  return (
    <FormScreen>
      <Title>Join your educator</Title>
      <Muted>Enter the invite code your teacher gave you. They will see your practice and can assign you sets.</Muted>
      {me?.educatorName && !joined && <Muted>You are linked to {me.educatorName}. Joining someone else moves you and your history to them.</Muted>}
      {joined ? (
        <>
          <SuccessBanner message={`You joined ${joined}.`} />
          <Button title="Done" size="lg" onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        </>
      ) : (
        <>
          {join.error && <ErrorBanner message={join.error instanceof ApiError ? join.error.message : 'Something went wrong. Please try again.'} />}
          <TextField
            label="Invite code"
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="e.g. K7M2QX"
            returnKeyType="go"
            onSubmitEditing={submit}
            style={{ fontSize: 22, letterSpacing: 4, fontWeight: '700' }}
            testID="join-code"
          />
          <Button title="Join" size="lg" onPress={submit} loading={join.isPending} disabled={!code.trim()} testID="join-submit" />
        </>
      )}
    </FormScreen>
  )
}
