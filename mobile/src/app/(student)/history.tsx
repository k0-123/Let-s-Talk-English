import { useState } from 'react'

import { useAuth } from '@/auth/AuthProvider'
import { FeedbackHistory, PractisedSets } from '@/components/history'
import { Screen, Segmented, Title } from '@/components/ui'

type Tab = 'sets' | 'feedback'

export default function History() {
  const { me } = useAuth()
  const [tab, setTab] = useState<Tab>('sets')
  const showFeedback = !!me?.ai.enabled
  return (
    <Screen>
      <Title>History</Title>
      {showFeedback && (
        <Segmented<Tab>
          options={[
            { value: 'sets', label: 'Practised sets' },
            { value: 'feedback', label: 'AI feedback' },
          ]}
          value={tab}
          onChange={setTab}
        />
      )}
      {tab === 'feedback' && showFeedback ? <FeedbackHistory /> : <PractisedSets />}
    </Screen>
  )
}
