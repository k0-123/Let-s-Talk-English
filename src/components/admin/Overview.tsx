import type { ServerProps } from 'payload'

import { getUsageStats } from '@/lib/stats'
import type { User } from '@/payload-types'

/** Usage numbers at the top of the admin dashboard. */
export const Overview = async ({ payload, user }: ServerProps) => {
  if (!user || (user as User).role !== 'admin') return null
  const stats = await getUsageStats(payload, user as User)

  const tiles: { label: string; value: number; hint?: string; href?: string; highlight?: boolean }[] = [
    {
      label: 'Educators waiting for approval',
      value: stats.pendingEducators,
      href: '/admin/collections/users?where[role][equals]=educator&where[approved][not_equals]=true',
      highlight: stats.pendingEducators > 0,
    },
    { label: 'Students', value: stats.students, hint: `${stats.educators} approved educators` },
    { label: 'New accounts', value: stats.signups7, hint: `last 7 days · ${stats.signups30} in 30 days` },
    { label: 'Active students', value: stats.activeStudents7, hint: 'practised in the last 7 days' },
    { label: 'Sets practised', value: stats.practisedThisWeek, hint: `this week · ${stats.practisedAllTime} all time` },
    { label: 'Published sets', value: stats.publishedSets, href: '/admin/collections/question-sets' },
    { label: 'AI feedback today', value: stats.aiToday },
  ]

  return (
    <section style={{ marginBottom: 'calc(var(--base) * 1.5)' }}>
      <h2 style={{ margin: '0 0 calc(var(--base) * 0.75)' }}>Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 'calc(var(--base) * 0.5)' }}>
        {tiles.map((tile) => {
          const content = (
            <>
              <div style={{ fontSize: 12, opacity: 0.75 }}>{tile.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{tile.value}</div>
              {tile.hint && <div style={{ fontSize: 12, opacity: 0.65 }}>{tile.hint}</div>}
            </>
          )
          const style = {
            display: 'block',
            padding: 'calc(var(--base) * 0.75)',
            borderRadius: 8,
            border: `1px solid ${tile.highlight ? 'var(--theme-warning-500)' : 'var(--theme-elevation-150)'}`,
            background: tile.highlight ? 'var(--theme-warning-50)' : 'var(--theme-elevation-50)',
            textDecoration: 'none',
            color: 'inherit',
          } as const
          return tile.href ? (
            <a key={tile.label} href={tile.href} style={style}>
              {content}
            </a>
          ) : (
            <div key={tile.label} style={style}>
              {content}
            </div>
          )
        })}
      </div>
      {stats.topCategories.length > 0 && (
        <p style={{ marginTop: 'calc(var(--base) * 0.75)', fontSize: 13, opacity: 0.8 }}>
          Most practised in the last 30 days: {stats.topCategories.map((c) => `${c.name} (${c.count})`).join(', ')}.{' '}
          <a href="/exports/practice-logs.csv">Download all practice logs (CSV)</a>
        </p>
      )}
    </section>
  )
}
