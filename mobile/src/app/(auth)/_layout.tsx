import { Stack } from 'expo-router'

import { useAppTheme } from '@/theme/ThemeProvider'

export default function AuthLayout() {
  const { colors } = useAppTheme()
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: '',
        headerBackTitle: 'Back',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
    </Stack>
  )
}
