import { useState } from 'react'

import { FormScreen } from '@/components/FormScreen'
import { Button, ErrorBanner, Muted, SuccessBanner, TextField, Title } from '@/components/ui'
import { ApiError, forgotPasswordRequest } from '@/lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await forgotPasswordRequest(email)
      setSent(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <FormScreen>
      <Title>Reset your password</Title>
      <Muted>Enter the email you signed up with. We will send you a link to choose a new password.</Muted>
      {error && <ErrorBanner message={error} />}
      {sent ? (
        <SuccessBanner message="If there is an account for that email, a reset link is on its way. Open it, choose a new password, then log in here." />
      ) : (
        <>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={submit}
            testID="forgot-email"
          />
          <Button title="Send reset link" size="lg" onPress={submit} loading={busy} />
        </>
      )}
    </FormScreen>
  )
}
