import { Link } from 'expo-router'
import { useRef, useState } from 'react'
import { type TextInput } from 'react-native'

import { useAuth } from '@/auth/AuthProvider'
import { FormScreen } from '@/components/FormScreen'
import { Button, ErrorBanner, Muted, Row, TextField, Title } from '@/components/ui'
import { loginErrorMessage } from '@/lib/messages'
import { useAppTheme } from '@/theme/ThemeProvider'

export default function Login() {
  const { signIn } = useAuth()
  const { colors } = useAppTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const passwordRef = useRef<TextInput>(null)

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (e) {
      setError(loginErrorMessage(e))
      setBusy(false)
    }
  }

  return (
    <FormScreen>
      <Title>Log in</Title>
      {error && <ErrorBanner message={error} />}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        testID="login-email"
      />
      <TextField
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        testID="login-password"
      />
      <Row style={{ justifyContent: 'space-between' }}>
        <Button title={showPassword ? 'Hide password' : 'Show password'} variant="ghost" size="sm" onPress={() => setShowPassword((v) => !v)} />
        <Link href="/forgot-password" style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
          Forgot your password?
        </Link>
      </Row>
      <Button title="Log in" size="lg" onPress={submit} loading={busy} testID="login-submit" />
      <Row style={{ justifyContent: 'center' }} gap={4}>
        <Muted>New here?</Muted>
        <Link href="/register" replace style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
          Create an account
        </Link>
      </Row>
    </FormScreen>
  )
}
