import { Redirect } from 'expo-router'

import { useAuth } from '@/auth/AuthProvider'
import { Loading } from '@/components/ui'

/** Sends everyone to the right place: sign-in, the student home or the educator's student list. */
export default function Index() {
  const { status, me } = useAuth()
  if (status === 'loading') return <Loading />
  if (status === 'signedOut') return <Redirect href="/welcome" />
  return <Redirect href={me?.user.role === 'educator' ? '/students' : '/home'} />
}
