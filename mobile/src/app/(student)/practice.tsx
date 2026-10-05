import { router } from 'expo-router'

import { useCategories } from '@/api/hooks'
import { Hint, QueryState } from '@/components/layout'
import { CategoryRow } from '@/components/rows'
import { EmptyState, Muted, Screen, Title } from '@/components/ui'

export default function Practice() {
  const query = useCategories()
  if (!query.data) return <QueryState isPending={query.isPending} error={query.error} onRetry={() => query.refetch()} />
  const categories = query.data.categories.filter((c) => (c.total ?? 0) > 0)

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Title>Practice</Title>
      <Muted>Choose a part. You get a few new sets at a time, and a set you have practised never comes back in this cycle.</Muted>
      {categories.length ? (
        categories.map((c) => (
          <CategoryRow key={c.id} category={c} onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: c.slug } })} />
        ))
      ) : (
        <EmptyState icon="library-outline" title="No sets yet" message="Your question sets will appear here once they are published." />
      )}
      <Hint>Tip: practise out loud. Use the timer and recorder on each set, then listen back.</Hint>
    </Screen>
  )
}
