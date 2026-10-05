import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'

import { useAppTheme } from '@/theme/ThemeProvider'

export const Logo = ({ size = 56, withName = false }: { size?: number; withName?: boolean }) => {
  const { colors } = useAppTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="chatbubbles" size={size * 0.52} color={colors.primaryForeground} />
      </View>
      {withName && <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground }}>Let&apos;s Talk English</Text>}
    </View>
  )
}
