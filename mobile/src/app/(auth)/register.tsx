import { Link, router } from 'expo-router'
import { useState } from 'react'

import { FormScreen } from '@/components/FormScreen'
import { Button, ErrorBanner, Muted, Row, Segmented, TextField, Title } from '@/components/ui'
import { registerRequest } from '@/lib/api'
import { registerErrorMessage, validateRegistration, type RegisterInput } from '@/lib/messages'
import { useAppTheme } from '@/theme/ThemeProvider'

type Role = 'student' | 'educator'

export default function Register() {
  const { colors } = useAppTheme()
  const [role, setRole] = useState<Role>('student')
  const [form, setForm] = useState<RegisterInput>({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (key: keyof RegisterInput) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async () => {
    const found = validateRegistration(form)
    setErrors(found)
    setError(null)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      await registerRequest({ name: form.name.trim(), email: form.email, password: form.password, role })
      router.replace({ pathname: '/check-email', params: { role, email: form.email.trim().toLowerCase() } })
    } catch (e) {
      const { field, message } = registerErrorMessage(e)
      if (field) setErrors({ [field]: message })
      else setError(message)
      setBusy(false)
    }
  }

  return (
    <FormScreen>
      <Title>Create your account</Title>
      <Segmented<Role>
        options={[
          { value: 'student', label: "I'm a student" },
          { value: 'educator', label: "I'm an educator" },
        ]}
        value={role}
        onChange={setRole}
      />
      {role === 'educator' && <Muted>Educator accounts are checked by the admin before you can log in. We will email you when yours is approved.</Muted>}
      {error && <ErrorBanner message={error} />}
      <TextField label="Your name" value={form.name} onChangeText={set('name')} error={errors.name} autoComplete="name" textContentType="name" testID="register-name" />
      <TextField
        label="Email"
        value={form.email}
        onChangeText={set('email')}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        testID="register-email"
      />
      <TextField
        label="Password"
        value={form.password}
        onChangeText={set('password')}
        error={errors.password}
        hint="At least 8 characters."
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        testID="register-password"
      />
      <TextField
        label="Confirm password"
        value={form.confirmPassword}
        onChangeText={set('confirmPassword')}
        error={errors.confirmPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
        testID="register-confirm"
      />
      <Button title="Create account" size="lg" onPress={submit} loading={busy} testID="register-submit" />
      <Muted style={{ fontSize: 12, textAlign: 'center' }}>By creating an account you agree to the terms and privacy policy on our website.</Muted>
      <Row style={{ justifyContent: 'center' }} gap={4}>
        <Muted>Already have an account?</Muted>
        <Link href="/login" replace style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
          Log in
        </Link>
      </Row>
    </FormScreen>
  )
}
