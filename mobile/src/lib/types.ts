/** Shapes returned by the server's app API (src/endpoints/app.ts in the website project). */

export type Role = 'student' | 'educator' | 'admin'
export type ThemePreference = 'system' | 'light' | 'dark'
export type ActivityStatus = 'active' | 'slipping' | 'inactive' | 'new'

export type AppUser = {
  id: string
  name: string
  email: string
  role: Role
  approved: boolean
  cycle: number
  weeklyGoal: number
  theme: ThemePreference
  inviteCode: string | null
  hasEducator: boolean
}

export type Me = {
  user: AppUser
  educatorName: string | null
  ai: { enabled: boolean; limit: number; usedToday: number }
}

export type DayCount = { day: string; count: number }

export type Progress = {
  streak: { current: number; best: number; practisedToday: boolean }
  activity: DayCount[]
  thisWeek: number
  weeklyGoal: number
  totalAllTime: number
  totalThisCycle: number
  averageConfidence: number | null
  recent: { setId: string | null; practisedAt: string }[]
}

export type CategoryCount = {
  id: string
  name: string
  slug: string
  description?: string | null
  remaining: number
  total: number
}

export type Assignment = {
  id: string
  setId: string | null
  topic: string | null
  categoryId: string | null
  studentId: string | null
  studentName: string | null
  note: string | null
  dueDate: string | null
  createdAt: string
  done: boolean
  overdue: boolean
}

export type HistoryEntry = {
  id: string
  setId: string | null
  topic: string | null
  categoryId: string | null
  practisedAt: string
  markedBy: 'student' | 'educator' | 'admin'
  cycle: number
  confidence: number | null
  speakingSeconds: number | null
}

export type HistoryPage = { entries: HistoryEntry[]; totalDocs: number; page: number; totalPages: number }

export type Dashboard = {
  progress: Progress
  categories: CategoryCount[]
  assignments: Assignment[]
  recent: HistoryEntry[]
}

export type SetSummary = { id: string; topic: string; questionCount: number; categoryId: string | null }

export type SetsPage = { sets: SetSummary[]; remaining: number; page: number; totalPages: number }

export type FeedbackResult = {
  estimatedBand: number
  fluencyCoherence: { score: number; comment: string }
  lexicalResource: { score: number; comment: string }
  grammaticalRange: { score: number; comment: string }
  pronunciationNote: string
  strengths: string[]
  improvements: string[]
  improvedAnswer: string
  usefulPhrases: string[]
}

export type FeedbackItem = {
  id: string
  setId: string | null
  topic: string | null
  questionIndex: number
  question: string
  answerText: string
  result: FeedbackResult
  createdAt: string
}

export type QuestionSet = {
  id: string
  topic: string
  category: { id: string; name: string; slug: string } | null
  questions: { question: string; answer: string | null }[]
  vocabulary: { term: string; meaning: string | null }[]
  tips: string | null
  imageUrl: string | null
}

export type SetDetail = { set: QuestionSet; practisedAt: string | null; feedback: FeedbackItem[] }

export type StudentSummary = {
  id: string
  name: string
  email: string
  cycle: number
  setsThisCycle: number
  setsAllTime: number
  lastActive: string | null
  joinedAt: string
  weekly: number[]
  status: ActivityStatus
}

export type StudentDetail = {
  student: { id: string; name: string; email: string; cycle: number }
  progress: Progress
  categories: CategoryCount[]
  assignments: Assignment[]
  notes: { id: string; body: string; createdAt: string }[]
}
