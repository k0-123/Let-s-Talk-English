import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'

import { Screen } from './ui'

/** A screen with a form: scrolls, and moves up out of the keyboard's way. */
export const FormScreen = ({ children }: { children: ReactNode }) => (
  <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Screen edges={['bottom']} contentStyle={{ paddingTop: 8, gap: 18, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
      {children}
    </Screen>
  </KeyboardAvoidingView>
)
