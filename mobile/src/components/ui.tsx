import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps, ReactNode, Ref } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { initials } from '@/lib/format'
import { useAppTheme } from '@/theme/ThemeProvider'

export type IconName = ComponentProps<typeof Ionicons>['name']

// ---------------------------------------------------------------- layout

/** A scrolling screen with pull-to-refresh and safe-area padding, and an optional bar fixed at the bottom. */
export const Screen = ({
  children,
  refreshing,
  onRefresh,
  edges = ['top'],
  scroll = true,
  contentStyle,
  footer,
}: {
  children: ReactNode
  refreshing?: boolean
  onRefresh?: () => void
  edges?: ('top' | 'bottom')[]
  scroll?: boolean
  contentStyle?: StyleProp<ViewStyle>
  footer?: ReactNode
}) => {
  const { colors } = useAppTheme()
  const insets = useSafeAreaInsets()
  const content = [styles.content, contentStyle]
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={content}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, content]}>{children}</View>
  )
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      {footer ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
          {body}
          <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: 12 + (edges.includes('bottom') ? 0 : insets.bottom) }]}>
            {footer}
          </View>
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  )
}

export const Row = ({ children, style, gap = 8, ...rest }: ViewProps & { gap?: number }) => (
  <View {...rest} style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>
    {children}
  </View>
)

export const Card = ({ children, style, accent, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: boolean; testID?: string }) => {
  const { colors } = useAppTheme()
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: accent ? colors.primary : colors.border },
        style,
      ]}
    >
      {children}
    </View>
  )
}

// ---------------------------------------------------------------- text

type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number; testID?: string }

export const Title = ({ children, style, numberOfLines, testID }: TextProps) => {
  const { colors } = useAppTheme()
  return (
    <Text accessibilityRole="header" testID={testID} numberOfLines={numberOfLines} style={[styles.title, { color: colors.foreground }, style]}>
      {children}
    </Text>
  )
}

export const Heading = ({ children, style, numberOfLines, testID }: TextProps) => {
  const { colors } = useAppTheme()
  return (
    <Text accessibilityRole="header" testID={testID} numberOfLines={numberOfLines} style={[styles.heading, { color: colors.foreground }, style]}>
      {children}
    </Text>
  )
}

export const Body = ({ children, style, numberOfLines, testID }: TextProps) => {
  const { colors } = useAppTheme()
  return (
    <Text testID={testID} numberOfLines={numberOfLines} style={[styles.body, { color: colors.foreground }, style]}>
      {children}
    </Text>
  )
}

export const Muted = ({ children, style, numberOfLines, testID }: TextProps) => {
  const { colors } = useAppTheme()
  return (
    <Text testID={testID} numberOfLines={numberOfLines} style={[styles.muted, { color: colors.mutedForeground }, style]}>
      {children}
    </Text>
  )
}

// ---------------------------------------------------------------- controls

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  size = 'md',
  style,
  testID,
  accessibilityLabel,
}: {
  title: string
  onPress?: () => void
  variant?: ButtonVariant
  icon?: IconName
  loading?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  style?: StyleProp<ViewStyle>
  testID?: string
  accessibilityLabel?: string
}) => {
  const { colors } = useAppTheme()
  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.primaryForeground, border: colors.primary },
    secondary: { bg: colors.secondary, fg: colors.secondaryForeground, border: colors.secondary },
    outline: { bg: 'transparent', fg: colors.foreground, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    destructive: { bg: colors.destructive, fg: '#ffffff', border: colors.destructive },
  }
  const p = palette[variant]
  const height = size === 'lg' ? 52 : size === 'sm' ? 36 : 44
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { height, backgroundColor: p.bg, borderColor: p.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={p.fg} />}
          <Text style={[styles.buttonText, { color: p.fg, fontSize: size === 'lg' ? 17 : size === 'sm' ? 14 : 15 }]}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

export const TextField = ({
  label,
  error,
  hint,
  style,
  ref,
  ...props
}: TextInputProps & { label: string; error?: string | null; hint?: string; ref?: Ref<TextInput> }) => {
  const { colors } = useAppTheme()
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: error ? colors.destructive : colors.input, color: colors.foreground, outlineColor: colors.primary },
          props.multiline && { height: undefined, minHeight: 100, paddingTop: 12, textAlignVertical: 'top' },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={{ color: colors.destructive, fontSize: 13 }}>{error}</Text> : hint ? <Muted style={{ fontSize: 12 }}>{hint}</Muted> : null}
    </View>
  )
}

export const Chip = ({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) => {
  const { colors } = useAppTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
    >
      <Text style={{ color: active ? colors.primaryForeground : colors.foreground, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  )
}

export const Segmented = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) => {
  const { colors } = useAppTheme()
  return (
    <View accessibilityRole="tablist" style={[styles.segmented, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: colors.card }]}
          >
            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: active ? colors.foreground : colors.mutedForeground }}>
              {o.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ---------------------------------------------------------------- display

export const Badge = ({ label, tone = 'secondary', icon }: { label: string; tone?: 'secondary' | 'success' | 'warning' | 'danger' | 'outline'; icon?: IconName }) => {
  const { colors } = useAppTheme()
  const tones = {
    secondary: { bg: colors.secondary, fg: colors.secondaryForeground },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.muted, fg: colors.destructive },
    outline: { bg: 'transparent', fg: colors.mutedForeground },
  }
  const t = tones[tone]
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: tone === 'outline' ? colors.border : t.bg }]}>
      {icon && <Ionicons name={icon} size={12} color={t.fg} />}
      <Text style={{ color: t.fg, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  )
}

export const ProgressBar = ({ value, max, label, color }: { value: number; max: number; label: string; color?: string }) => {
  const { colors } = useAppTheme()
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: value }}
      style={{ height: 8, borderRadius: 4, backgroundColor: colors.chart[0], overflow: 'hidden' }}
    >
      <View style={{ width: `${pct * 100}%`, height: 8, borderRadius: 4, backgroundColor: color ?? colors.primary }} />
    </View>
  )
}

export const Avatar = ({ name, size = 40 }: { name: string; size?: number }) => {
  const palette = ['#6366f1', '#059669', '#0284c7', '#f43f5e', '#d97706', '#7c3aed', '#0d9488']
  const hash = [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0)
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: palette[hash % palette.length], alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{initials(name)}</Text>
    </View>
  )
}

export const StatTile = ({
  icon,
  label,
  value,
  hint,
  tone = 'primary',
  compact = false,
}: {
  icon: IconName
  label: string
  value: string | number
  hint?: string
  tone?: 'primary' | 'streak' | 'success'
  /** Three to a row on a phone: smaller, no hint. */
  compact?: boolean
}) => {
  const { colors } = useAppTheme()
  const tones = {
    primary: { bg: colors.secondary, fg: colors.primary },
    streak: { bg: colors.streakSoft, fg: colors.streak },
    success: { bg: colors.successSoft, fg: colors.success },
  }
  return (
    <Card style={{ flex: 1, minWidth: compact ? 96 : 140, gap: compact ? 4 : 6, padding: compact ? 12 : 14 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: tones[tone].bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={tones[tone].fg} />
      </View>
      <Muted style={{ fontSize: 12, lineHeight: 16 }}>{label}</Muted>
      <Text style={{ fontSize: compact ? 20 : 22, fontWeight: '800', color: colors.foreground }}>{value}</Text>
      {hint && !compact ? <Muted style={{ fontSize: 12 }}>{hint}</Muted> : null}
    </Card>
  )
}

export const EmptyState = ({ icon, title, message, action }: { icon: IconName; title: string; message?: string; action?: ReactNode }) => {
  const { colors } = useAppTheme()
  return (
    <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Heading style={{ textAlign: 'center' }}>{title}</Heading>
      {message ? <Muted style={{ textAlign: 'center' }}>{message}</Muted> : null}
      {action}
    </View>
  )
}

export const ErrorBanner = ({ message }: { message: string }) => {
  const { colors } = useAppTheme()
  return (
    <View accessibilityRole="alert" style={[styles.banner, { borderColor: colors.destructive, backgroundColor: colors.muted }]}>
      <Ionicons name="alert-circle" size={18} color={colors.destructive} />
      <Text style={{ color: colors.destructive, flex: 1, fontSize: 14 }}>{message}</Text>
    </View>
  )
}

export const SuccessBanner = ({ message }: { message: string }) => {
  const { colors } = useAppTheme()
  return (
    <View accessibilityRole="alert" style={[styles.banner, { borderColor: colors.success, backgroundColor: colors.successSoft }]}>
      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      <Text style={{ color: colors.foreground, flex: 1, fontSize: 14 }}>{message}</Text>
    </View>
  )
}

export const Loading = () => {
  const { colors } = useAppTheme()
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  )
}

/** Tappable list row with a chevron. */
export const ListRow = ({ children, onPress, accessibilityLabel, testID }: { children: ReactNode; onPress: () => void; accessibilityLabel?: string; testID?: string }) => {
  const { colors } = useAppTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.listRow, { borderColor: colors.border, backgroundColor: pressed ? colors.muted : colors.card }]}
    >
      <View style={{ flex: 1, gap: 4 }}>{children}</View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  heading: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  muted: { fontSize: 14, lineHeight: 20 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16 },
  buttonText: { fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600' },
  input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  segmented: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  empty: { alignItems: 'center', gap: 10, padding: 24, borderWidth: 1, borderStyle: 'dashed', borderRadius: 16 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12, gap: 10 },
})
