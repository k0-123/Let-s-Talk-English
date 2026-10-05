import { Pressable, Text, View } from 'react-native'

import { vibrate } from '@/lib/device'
import { useAppTheme } from '@/theme/ThemeProvider'

import { Muted } from './ui'

export const CONFIDENCE_LABELS = ['Not at all', 'A little', 'Okay', 'Quite', 'Very'] as const

/** "How confident were you?" on a 1–5 scale. Tapping the chosen value again clears it. */
export const ConfidencePicker = ({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) => {
  const { colors } = useAppTheme()
  return (
    <View style={{ gap: 8 }}>
      <View accessibilityRole="radiogroup" accessibilityLabel="How confident were you?" style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n
          return (
            <Pressable
              key={n}
              accessibilityRole="radio"
              accessibilityLabel={`${n}: ${CONFIDENCE_LABELS[n - 1]}`}
              accessibilityState={{ selected }}
              testID={`confidence-${n}`}
              onPress={() => {
                vibrate('tap')
                onChange(selected ? null : n)
              }}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.primary : colors.card,
                borderColor: selected ? colors.primary : colors.border,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: selected ? colors.primaryForeground : colors.foreground }}>{n}</Text>
            </Pressable>
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Muted style={{ fontSize: 12 }}>Not at all</Muted>
        <Muted style={{ fontSize: 12 }}>{value ? CONFIDENCE_LABELS[value - 1] : 'Optional'}</Muted>
        <Muted style={{ fontSize: 12 }}>Very</Muted>
      </View>
    </View>
  )
}
