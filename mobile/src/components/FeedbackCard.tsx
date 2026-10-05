import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Text, View } from 'react-native'

import { copyText } from '@/lib/device'
import type { FeedbackResult } from '@/lib/types'
import { useAppTheme } from '@/theme/ThemeProvider'

import { Body, Button, Card, Muted, ProgressBar, Row, type IconName } from './ui'

const criteria = [
  { key: 'fluencyCoherence', label: 'Fluency and coherence' },
  { key: 'lexicalResource', label: 'Vocabulary' },
  { key: 'grammaticalRange', label: 'Grammar' },
] as const

const List = ({ title, icon, items, tone }: { title: string; icon: IconName; items: string[]; tone: 'success' | 'warning' | 'primary' }) => {
  const { colors } = useAppTheme()
  const t = {
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    primary: { bg: colors.secondary, fg: colors.primary },
  }[tone]
  if (!items.length) return null
  return (
    <View style={{ backgroundColor: t.bg, borderRadius: 12, padding: 12, gap: 6 }}>
      <Row gap={6}>
        <Ionicons name={icon} size={16} color={t.fg} />
        <Text style={{ color: t.fg, fontWeight: '700', fontSize: 14 }}>{title}</Text>
      </Row>
      {items.map((item, i) => (
        <Row key={i} gap={8} style={{ alignItems: 'flex-start' }}>
          <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>•</Text>
          <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20, flex: 1 }}>{item}</Text>
        </Row>
      ))}
    </View>
  )
}

/** Claude's feedback on one answer. The band is an estimate, and the card says so. */
export const FeedbackCard = ({ result }: { result: FeedbackResult }) => {
  const { colors } = useAppTheme()
  const [copied, setCopied] = useState(false)
  return (
    <Card style={{ gap: 14 }} testID="feedback-card">
      <Row gap={14}>
        <View
          accessible
          accessibilityLabel={`Estimated band ${result.estimatedBand.toFixed(1)}`}
          style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: colors.primaryForeground, fontSize: 24, fontWeight: '800' }}>{result.estimatedBand.toFixed(1)}</Text>
          <Text style={{ color: colors.primaryForeground, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>BAND</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Row gap={6}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.foreground }}>AI feedback</Text>
          </Row>
          <Muted style={{ fontSize: 12 }}>An estimate to guide your practice, not an official IELTS score.</Muted>
        </View>
      </Row>

      {criteria.map((c) => {
        const item = result[c.key]
        return (
          <View key={c.key} style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '600', color: colors.foreground, fontSize: 14 }}>{c.label}</Text>
              <Text style={{ fontWeight: '700', color: colors.foreground, fontSize: 14 }}>{item.score.toFixed(1)}</Text>
            </Row>
            <ProgressBar value={item.score} max={9} label={`${c.label}: ${item.score.toFixed(1)} out of 9`} />
            <Muted>{item.comment}</Muted>
          </View>
        )
      })}
      <View style={{ gap: 4 }}>
        <Text style={{ fontWeight: '600', color: colors.foreground, fontSize: 14 }}>Pronunciation</Text>
        <Muted>{result.pronunciationNote}</Muted>
      </View>

      <List title="What went well" icon="thumbs-up" items={result.strengths} tone="success" />
      <List title="What to improve" icon="construct" items={result.improvements} tone="warning" />

      <View style={{ gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '700', color: colors.foreground, fontSize: 14 }}>A stronger answer</Text>
          <Button
            title={copied ? 'Copied' : 'Copy'}
            icon={copied ? 'checkmark' : 'copy-outline'}
            variant="ghost"
            size="sm"
            onPress={async () => {
              if (await copyText(result.improvedAnswer)) {
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }
            }}
          />
        </Row>
        <Body style={{ fontSize: 14 }}>{result.improvedAnswer}</Body>
      </View>

      <List title="Phrases to learn" icon="bulb" items={result.usefulPhrases} tone="primary" />
    </Card>
  )
}
