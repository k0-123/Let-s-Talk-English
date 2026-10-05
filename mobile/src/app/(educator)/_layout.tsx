import { TabsLayout } from '@/components/TabsLayout'

export default function EducatorTabs() {
  return (
    <TabsLayout
      tabs={[
        { name: 'students', title: 'Students', icon: 'people-outline', activeIcon: 'people' },
        { name: 'assignments', title: 'Assignments', icon: 'clipboard-outline', activeIcon: 'clipboard' },
        { name: 'settings', title: 'Me', icon: 'person-circle-outline', activeIcon: 'person-circle' },
      ]}
    />
  )
}
