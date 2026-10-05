import { useState } from 'react'
import { Text, View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'

import { formatDayKey, monthOfDayKey } from '@/lib/format'
import type { DayCount } from '@/lib/types'
import { useAppTheme } from '@/theme/ThemeProvider'

import { Muted } from './ui'

/** Weekly goal as a radial meter (track and fill from the same hue). */
export const GoalRing = ({ value, goal, size = 84 }: { value: number; goal: number; size?: number }) => {
  const { colors } = useAppTheme()
  const r = 15.5
  const c = 2 * Math.PI * r
  const ratio = goal > 0 ? Math.min(1, value / goal) : 0
  return (
    <View accessible accessibilityLabel={`${value} of ${goal} sets this week`} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 36 36" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={18} cy={18} r={r} fill="none" strokeWidth={3.5} stroke={colors.chart[0]} />
        <Circle
          cx={18}
          cy={18}
          r={r}
          fill="none"
          strokeWidth={3.5}
          strokeLinecap="round"
          stroke={value >= goal ? colors.success : colors.primary}
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - ratio)}
        />
      </Svg>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.foreground }}>{value}</Text>
        <Muted style={{ fontSize: 11 }}>of {goal}</Muted>
      </View>
    </View>
  )
}

const level = (count: number) => (count <= 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4)

/** Practice calendar: one column per week, Monday at the top; tap a day for its count. */
export const Heatmap = ({ days, today }: { days: DayCount[]; today: string }) => {
  const { colors } = useAppTheme()
  const [selected, setSelected] = useState<DayCount | null>(null)
  const [width, setWidth] = useState(0)
  const weeks = Math.ceil(days.length / 7)
  const gap = 3
  const cell = width > 0 ? Math.min(18, (width - gap * (weeks - 1)) / weeks) : 12
  const total = days.reduce((s, d) => s + d.count, 0)
  const active = days.filter((d) => d.count > 0).length

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessible accessibilityLabel={`Practice calendar: ${total} sets on ${active} days in the last ${weeks} weeks`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Muted style={{ fontSize: 11 }}>{days[0] ? monthOfDayKey(days[0].day) : ''}</Muted>
        <Muted style={{ fontSize: 11 }}>{monthOfDayKey(today)}</Muted>
      </View>
      {width > 0 && (
        <Svg width={width} height={7 * (cell + gap)}>
          {days.map((d, i) => {
            if (d.day > today) return null
            const x = Math.floor(i / 7) * (cell + gap)
            const y = (i % 7) * (cell + gap)
            return (
              <Rect
                key={d.day}
                x={x}
                y={y}
                width={cell}
                height={cell}
                rx={3}
                fill={colors.chart[level(d.count)]}
                stroke={d.day === today ? colors.foreground : undefined}
                strokeWidth={d.day === today ? 1.5 : 0}
                onPress={() => setSelected(d)}
              />
            )
          })}
        </Svg>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <Muted style={{ fontSize: 12 }}>
          {selected ? `${formatDayKey(selected.day)}: ${selected.count} ${selected.count === 1 ? 'set' : 'sets'}` : `${total} sets on ${active} days`}
        </Muted>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Muted style={{ fontSize: 11 }}>Less</Muted>
          {colors.chart.map((c) => (
            <View key={c} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }} />
          ))}
          <Muted style={{ fontSize: 11 }}>More</Muted>
        </View>
      </View>
    </View>
  )
}

/** Tiny weekly activity line. */
export const Sparkline = ({ values, width = 80, height = 24 }: { values: number[]; width?: number; height?: number }) => {
  const { colors } = useAppTheme()
  if (values.length < 2) return null
  const max = Math.max(1, ...values)
  const step = (width - 4) / (values.length - 1)
  const pts = values.map((v, i) => [2 + i * step, height - 3 - (v / max) * (height - 6)] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <View accessible accessibilityLabel={`Sets per week: ${values.join(', ')}`}>
      <Svg width={width} height={height}>
        <Path d={d} fill="none" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={last[0]} cy={last[1]} r={2.5} fill={colors.primary} />
      </Svg>
    </View>
  )
}
