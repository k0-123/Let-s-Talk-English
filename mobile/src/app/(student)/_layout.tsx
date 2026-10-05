import { TabsLayout } from '@/components/TabsLayout'

export default function StudentTabs() {
  return (
    <TabsLayout
      tabs={[
        { name: 'home', title: 'Home', icon: 'home-outline', activeIcon: 'home' },
        { name: 'practice', title: 'Practice', icon: 'mic-outline', activeIcon: 'mic' },
        { name: 'history', title: 'History', icon: 'time-outline', activeIcon: 'time' },
        { name: 'me', title: 'Me', icon: 'person-circle-outline', activeIcon: 'person-circle' },
      ]}
    />
  )
}
