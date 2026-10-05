import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router/js-tabs'

import { useAppTheme } from '@/theme/ThemeProvider'

type Tab = { name: string; title: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }

/** Bottom tabs in the app's colours. */
export const TabsLayout = ({ tabs }: { tabs: Tab[] }) => {
  const { colors } = useAppTheme()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarButtonTestID: `tab-${tab.name}`,
            tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? tab.activeIcon : tab.icon} color={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  )
}
