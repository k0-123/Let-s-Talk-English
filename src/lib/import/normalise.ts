import type { RawRecord } from './parse'

export type CandidateQuestion = { question: string; answer?: string }
export type CandidateVocabulary = { term: string; meaning?: string }

export type CandidateSet = {
  code?: string
  category: string
  topic: string
  questions: CandidateQuestion[]
  vocabulary: CandidateVocabulary[]
  tips?: string
  status?: 'draft' | 'published'
}

export type NormaliseResult = { set: CandidateSet | null; errors: string[] }

export const MAX_TOPIC_LENGTH = 200

const text = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\r\n/g, '\n').trim()
}

const first = (data: RawRecord, ...keys: string[]): string => {
  for (const key of keys) {
    const value = text(data[key])
    if (value) return value
  }
  return ''
}

const lines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

/** "bustling - full of activity", "bustling: full of…", "bustling = …" or just "bustling". */
export const parseVocabularyLine = (line: string): CandidateVocabulary | null => {
  const cleaned = line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim()
  if (!cleaned) return null
  const match = cleaned.match(/^(.+?)\s*(?:\s[-–—]\s|:|=)\s*(.+)$/)
  if (match) return { term: match[1].trim(), meaning: match[2].trim() }
  return { term: cleaned }
}

const parseVocabulary = (value: unknown): CandidateVocabulary[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return parseVocabularyLine(item)
        if (item && typeof item === 'object') {
          const term = text((item as RawRecord).term ?? (item as RawRecord).word)
          const meaning = text((item as RawRecord).meaning ?? (item as RawRecord).definition)
          return term ? { term, ...(meaning ? { meaning } : {}) } : null
        }
        return null
      })
      .filter((v): v is CandidateVocabulary => !!v)
  }
  const raw = text(value)
  if (!raw) return []
  // One entry per line, or entries separated by semicolons.
  const parts = raw.includes('\n') ? lines(raw) : raw.split(';').map((p) => p.trim())
  return parts.map(parseVocabularyLine).filter((v): v is CandidateVocabulary => !!v)
}

const NUMBERED = /^(question|q|answer|a|sample_answer)_?(\d+)$/

const parseQuestions = (data: RawRecord, errors: string[]): CandidateQuestion[] => {
  // JSON style: "questions": ["...", { "question": "...", "answer": "..." }]
  if (Array.isArray(data.questions)) {
    const questions: CandidateQuestion[] = []
    data.questions.forEach((item, index) => {
      if (typeof item === 'string') {
        if (text(item)) questions.push({ question: text(item) })
        return
      }
      if (item && typeof item === 'object') {
        const question = text((item as RawRecord).question)
        const answer = text((item as RawRecord).answer ?? (item as RawRecord).sample_answer)
        if (!question) {
          if (answer) errors.push(`Question ${index + 1} has an answer but no question text.`)
          return
        }
        questions.push({ question, ...(answer ? { answer } : {}) })
      }
    })
    return questions
  }

  // Spreadsheet style: question_1, answer_1, question_2, answer_2, …
  const byNumber = new Map<number, { question?: string; answer?: string }>()
  for (const [key, value] of Object.entries(data)) {
    const match = key.match(NUMBERED)
    if (!match) continue
    const n = Number(match[2])
    const entry = byNumber.get(n) ?? {}
    const kind = match[1].startsWith('q') ? 'question' : 'answer'
    const v = text(value)
    if (v) entry[kind] = v
    byNumber.set(n, entry)
  }

  const questions: CandidateQuestion[] = []
  for (const n of [...byNumber.keys()].sort((a, b) => a - b)) {
    const entry = byNumber.get(n)!
    if (!entry.question) {
      if (entry.answer) errors.push(`Answer ${n} has no matching question ${n}.`)
      continue
    }
    questions.push({ question: entry.question, ...(entry.answer ? { answer: entry.answer } : {}) })
  }

  // Fallback: a single "questions" cell with one question per line.
  if (questions.length === 0 && typeof data.questions === 'string') {
    return lines(data.questions).map((question) => ({ question }))
  }
  return questions
}

export const normaliseRecord = (data: RawRecord): NormaliseResult => {
  const errors: string[] = []

  const topic = first(data, 'topic', 'title')
  const category = first(data, 'category', 'category_slug', 'part')
  const code = first(data, 'code', 'reference', 'reference_code') || undefined
  const tips = first(data, 'tips', 'tip') || undefined
  const statusRaw = first(data, 'status').toLowerCase()

  if (!topic) errors.push('Topic is missing.')
  else if (topic.length > MAX_TOPIC_LENGTH) errors.push(`Topic is longer than ${MAX_TOPIC_LENGTH} characters.`)
  if (!category) errors.push('Category is missing.')

  let status: CandidateSet['status']
  if (statusRaw) {
    if (statusRaw === 'draft' || statusRaw === 'published') status = statusRaw
    else errors.push(`Status must be "draft" or "published" (found "${statusRaw}").`)
  }

  const questions = parseQuestions(data, errors)
  if (questions.length === 0) errors.push('At least one question is needed.')

  const vocabulary = parseVocabulary(data.vocabulary ?? data.vocab)

  if (errors.length) return { set: null, errors }
  return {
    set: { code, category, topic, questions, vocabulary, tips, status },
    errors,
  }
}
