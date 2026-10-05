import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/auth/AuthProvider'
import type {
  Assignment,
  CategoryCount,
  Dashboard,
  FeedbackItem,
  HistoryPage,
  SetDetail,
  SetsPage,
  StudentDetail,
  StudentSummary,
} from '@/lib/types'

/** React Query hooks over the app API. Keys start with the area so mutations can refresh them. */

export const useDashboard = () => {
  const { api } = useAuth()
  return useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/api/app/student/dashboard') })
}

export const useCategories = () => {
  const { api } = useAuth()
  return useQuery({ queryKey: ['categories'], queryFn: () => api<{ categories: CategoryCount[] }>('/api/app/categories') })
}

export const useNextSets = (slug: string) => {
  const { api } = useAuth()
  return useQuery({
    queryKey: ['next', slug],
    queryFn: () => api<SetsPage & { category: { id: string; name: string; slug: string } }>(`/api/app/practice/${encodeURIComponent(slug)}/next`),
  })
}

export const useSet = (id: string, studentId?: string) => {
  const { api } = useAuth()
  return useQuery({
    queryKey: ['set', id, studentId ?? null],
    queryFn: () => api<SetDetail>(`/api/app/sets/${encodeURIComponent(id)}`, { query: { student: studentId } }),
  })
}

/** History, 20 at a time, with "load more". */
export const useHistory = (params: { category?: string; student?: string }) => {
  const { api } = useAuth()
  return useInfiniteQuery({
    queryKey: ['history', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api<HistoryPage>('/api/app/history', { query: { ...params, page: pageParam } }),
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  })
}

export const useFeedbackList = (params: { student?: string; setId?: string } = {}) => {
  const { api } = useAuth()
  return useQuery({ queryKey: ['feedback', params], queryFn: () => api<{ items: FeedbackItem[] }>('/api/app/feedback', { query: params }) })
}

export const useStudents = () => {
  const { api } = useAuth()
  return useQuery({
    queryKey: ['students'],
    queryFn: () => api<{ students: StudentSummary[]; inviteCode: string | null }>('/api/app/educator/students'),
  })
}

export const useStudent = (id: string) => {
  const { api } = useAuth()
  return useQuery({ queryKey: ['student', id], queryFn: () => api<StudentDetail>(`/api/app/educator/students/${encodeURIComponent(id)}`) })
}

export const useTodo = (id: string, params: { category?: string; q?: string; page?: number }) => {
  const { api } = useAuth()
  return useQuery({
    queryKey: ['todo', id, params],
    queryFn: () => api<SetsPage>(`/api/app/educator/students/${encodeURIComponent(id)}/todo`, { query: params }),
  })
}

export const useAssignments = () => {
  const { api } = useAuth()
  return useQuery({ queryKey: ['assignments'], queryFn: () => api<{ assignments: Assignment[] }>('/api/app/educator/assignments') })
}

/** After any write, refetch everything the write can affect. */
const useRefreshAll = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries()
}

export const useRecordPractice = () => {
  const { api } = useAuth()
  const refresh = useRefreshAll()
  return useMutation({
    mutationFn: (body: { setId: string; studentId?: string; confidence?: number | null; speakingSeconds?: number }) =>
      api<{ created: boolean; practisedAt: string }>('/api/app/practice', { method: 'POST', body }),
    onSuccess: refresh,
  })
}

export const useJoinEducator = () => {
  const { api, reloadMe } = useAuth()
  const refresh = useRefreshAll()
  return useMutation({
    mutationFn: (code: string) => api<{ educatorName: string }>('/api/app/join', { method: 'POST', body: { code } }),
    onSuccess: async () => {
      await reloadMe()
      await refresh()
    },
  })
}

export const useStartCycle = () => {
  const { api, reloadMe } = useAuth()
  const refresh = useRefreshAll()
  return useMutation({
    mutationFn: () => api<{ cycle: number }>('/api/app/cycle', { method: 'POST' }),
    onSuccess: async () => {
      await reloadMe()
      await refresh()
    },
  })
}

export const useAskFeedback = () => {
  const { api, reloadMe } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { setId: string; questionIndex: number; answerText: string }) =>
      api<{ item: FeedbackItem; usedToday: number; limit: number }>('/api/app/feedback', { method: 'POST', body }),
    onSuccess: async () => {
      await reloadMe()
      await queryClient.invalidateQueries({ queryKey: ['feedback'] })
    },
  })
}

export const useUpdateMe = () => {
  const { api, reloadMe } = useAuth()
  return useMutation({
    mutationFn: (body: { name?: string; weeklyGoal?: number; theme?: string }) => api('/api/app/me', { method: 'PATCH', body }),
    onSuccess: reloadMe,
  })
}

export const useAssignSets = () => {
  const { api } = useAuth()
  const refresh = useRefreshAll()
  return useMutation({
    mutationFn: (body: { studentId: string; setIds: string[]; note?: string; dueDate?: string | null }) =>
      api<{ created: number; skipped: number }>('/api/app/educator/assignments', { method: 'POST', body }),
    onSuccess: refresh,
  })
}

export const useRemoveAssignment = () => {
  const { api } = useAuth()
  const refresh = useRefreshAll()
  return useMutation({
    mutationFn: (id: string) => api(`/api/app/educator/assignments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: refresh,
  })
}

export const useAddNote = () => {
  const { api } = useAuth()
  const refresh = useRefreshAll()
  return useMutation({
    mutationFn: (body: { studentId: string; body: string }) => api('/api/app/educator/notes', { method: 'POST', body }),
    onSuccess: refresh,
  })
}

export const useDeleteNote = () => {
  const { api } = useAuth()
  const refresh = useRefreshAll()
  return useMutation({
    mutationFn: (id: string) => api(`/api/app/educator/notes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: refresh,
  })
}

export const useRegenerateCode = () => {
  const { api, reloadMe } = useAuth()
  const refresh = useRefreshAll()
  return useMutation({
    mutationFn: () => api<{ inviteCode: string }>('/api/app/educator/invite-code', { method: 'POST' }),
    onSuccess: async () => {
      await reloadMe()
      await refresh()
    },
  })
}
