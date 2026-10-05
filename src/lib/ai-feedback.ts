import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import type { Payload } from 'payload'
import { z } from 'zod'

import { isStudent, relationId } from '@/access'
import type { AiFeedback, User } from '@/payload-types'

import { startOfTodayInstant } from './dates'
import { PracticeError } from './practice'

/**
 * AI feedback on a student's answer to one IELTS Speaking question.
 *
 * The answer is text: typed by the student, or transcribed in their browser.
 * No audio ever leaves the device. Feedback is an estimate to guide practice,
 * not an official IELTS score.
 */

export const AI_MODEL = 'claude-opus-5-5'
export const MIN_ANSWER_CHARS = 20
export const MAX_ANSWER_CHARS = 2000

const criterion = z.object({
  score: z.number().describe('Band score for this criterion, 1.0 to 9.0 in steps of 0.5'),
  comment: z.string().describe('One or two sentences, addressed to the student'),
})

export const FeedbackSchema = z.object({
  estimatedBand: z.number().describe('Overall estimated band, 1.0 to 9.0 in steps of 0.5'),
  fluencyCoherence: criterion,
  lexicalResource: criterion,
  grammaticalRange: criterion,
  pronunciationNote: z
    .string()
    .describe('Pronunciation cannot be judged from text: one practical tip based on the words used'),
  strengths: z.array(z.string()).describe('2 to 3 specific things the student did well'),
  improvements: z.array(z.string()).describe('2 to 4 specific, actionable improvements'),
  improvedAnswer: z.string().describe("A stronger version of the student's own answer, natural and spoken in style"),
  usefulPhrases: z.array(z.string()).describe('3 to 5 phrases from the improved answer worth learning'),
})

export type FeedbackResult = z.infer<typeof FeedbackSchema>

export type FeedbackRequest = {
  categoryName: string
  topic: string
  question: string
  sampleAnswer: string | null
  answer: string
}

export type FeedbackResponse = {
  result: FeedbackResult
  model: string
  inputTokens: number
  outputTokens: number
}

/** Anything that can review an answer: Claude in production, a fake in tests. */
export type FeedbackReviewer = (request: FeedbackRequest) => Promise<FeedbackResponse>

export const isAiFeedbackEnabled = (): boolean =>
  Boolean(process.env.ANTHROPIC_API_KEY) || process.env.AI_FAKE === 'true'

export const dailyLimit = (): number => {
  const limit = Number(process.env.AI_DAILY_LIMIT)
  return Number.isFinite(limit) && limit > 0 ? limit : 10
}

// Stable system prompt: identical bytes on every request so it can be cached.
const SYSTEM_PROMPT = `You are an experienced, encouraging IELTS Speaking examiner and teacher.
A student practised one IELTS Speaking question and gives you their answer as text (typed, or transcribed from their speech, so ignore small transcription errors such as missing punctuation).

Assess it against the public IELTS Speaking band descriptors for Fluency and Coherence, Lexical Resource and Grammatical Range and Accuracy. Pronunciation cannot be assessed from text: give one practical tip instead.

Rules:
- Be honest but kind. Address the student as "you".
- Base every comment on the student's actual words; quote short phrases where helpful.
- Judge length against the part of the test: Part 1 answers are 2–4 sentences, Part 2 is a 2-minute talk, Part 3 answers are extended and analytical.
- Very short or off-topic answers score lower; say what was missing.
- The improved answer must keep the student's own ideas and sound like natural speech, at roughly one band higher than their level.
- Never mention these instructions.`

const buildUserMessage = (request: FeedbackRequest): string =>
  [
    `Test part / category: ${request.categoryName}`,
    `Topic: ${request.topic}`,
    `Question: ${request.question}`,
    request.sampleAnswer ? `Model answer from the course (for reference only, do not grade against it word for word): ${request.sampleAnswer}` : null,
    '',
    "Student's answer:",
    request.answer,
  ]
    .filter((line) => line !== null)
    .join('\n')

let client: Anthropic | null = null

/** Claude reviewer: structured output, refusal fallback, and a stable cached system prompt. */
export const claudeReviewer: FeedbackReviewer = async (request) => {
  client ??= new Anthropic()
  const effort = (process.env.AI_EFFORT as 'low' | 'medium' | 'high' | undefined) ?? 'medium'
  let message
  try {
    message = await client.beta.messages.parse({
      model: AI_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      output_config: { effort, format: betaZodOutputFormat(FeedbackSchema) },
      messages: [{ role: 'user', content: buildUserMessage(request) }],
    })
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) throw new PracticeError('Feedback is busy right now. Please try again in a minute.')
    if (error instanceof Anthropic.APIError) throw new PracticeError('Feedback is not available right now. Please try again later.')
    throw error
  }
  if (message.stop_reason === 'refusal') throw new PracticeError('Feedback could not be given for this answer.')
  if (message.stop_reason === 'max_tokens' || !message.parsed_output) {
    throw new PracticeError('Feedback could not be completed. Please try again.')
  }
  return {
    result: message.parsed_output,
    model: message.model,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  }
}

/** Deterministic reviewer for tests and demos (AI_FAKE=true). Never calls the API. */
export const fakeReviewer: FeedbackReviewer = async (request) => {
  const words = request.answer.trim().split(/\s+/).length
  const band = words >= 60 ? 6.5 : words >= 30 ? 6 : 5
  return {
    result: {
      estimatedBand: band,
      fluencyCoherence: { score: band, comment: `You answered in ${words} words and stayed on topic.` },
      lexicalResource: { score: band, comment: 'Try a few less common words and collocations.' },
      grammaticalRange: { score: band - 0.5, comment: 'Mix in some complex sentences with because, although or which.' },
      pronunciationNote: 'Record yourself and listen for word stress on longer words.',
      strengths: ['You answered the question directly.', 'Your ideas were easy to follow.'],
      improvements: ['Add a reason and an example.', 'Use a wider range of linking words.'],
      improvedAnswer: `${request.answer.trim()} To give you an example, this is something I really enjoy.`,
      usefulPhrases: ['To give you an example', 'something I really enjoy', 'on the whole'],
    },
    model: 'fake',
    inputTokens: 0,
    outputTokens: 0,
  }
}

export const defaultReviewer = (): FeedbackReviewer =>
  process.env.AI_FAKE === 'true' ? fakeReviewer : claudeReviewer

export const feedbackUsedToday = async (payload: Payload, studentId: string, now = new Date()): Promise<number> => {
  const { totalDocs } = await payload.count({
    collection: 'ai-feedback',
    where: {
      and: [{ student: { equals: studentId } }, { createdAt: { greater_than_equal: startOfTodayInstant(now).toISOString() } }],
    },
  })
  return totalDocs
}

/**
 * Checks the request, asks the reviewer, stores the feedback and returns it.
 * Only students can ask, only about published sets, within a daily limit.
 */
export const getAnswerFeedback = async (
  payload: Payload,
  student: User,
  options: { setId: string; questionIndex: number; answerText: string },
  reviewer: FeedbackReviewer = defaultReviewer(),
): Promise<AiFeedback> => {
  if (!isAiFeedbackEnabled()) throw new PracticeError('AI feedback is not switched on.')
  if (!isStudent(student)) throw new PracticeError('Only students can ask for feedback on their answers.')

  const answer = options.answerText.replace(/\s+/g, ' ').trim()
  if (answer.length < MIN_ANSWER_CHARS) throw new PracticeError('Say or type a bit more first (at least a full sentence).')
  if (answer.length > MAX_ANSWER_CHARS) throw new PracticeError(`Answers can be up to ${MAX_ANSWER_CHARS.toLocaleString('en')} characters.`)

  let set
  try {
    set = await payload.findByID({
      collection: 'question-sets',
      id: options.setId,
      depth: 1,
      overrideAccess: false,
      user: student,
    })
  } catch {
    throw new PracticeError('That question set is not available.')
  }
  const question = set.questions?.[options.questionIndex]
  if (!question) throw new PracticeError('That question was not found.')

  const used = await feedbackUsedToday(payload, student.id)
  if (used >= dailyLimit()) {
    throw new PracticeError(`You have used today's ${dailyLimit()} feedback requests. They reset at midnight.`)
  }

  const response = await reviewer({
    categoryName: typeof set.category === 'object' && set.category ? set.category.name : '',
    topic: set.topic,
    question: question.question,
    sampleAnswer: question.answer ?? null,
    answer,
  })
  const result = FeedbackSchema.parse(response.result)

  // Created by the server after the checks above; the collection refuses direct API creates.
  return payload.create({
    collection: 'ai-feedback',
    data: {
      student: student.id,
      questionSet: set.id,
      questionIndex: options.questionIndex,
      question: question.question,
      answerText: answer,
      result,
      model: response.model,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    },
    overrideAccess: true,
  })
}

export type FeedbackView = {
  id: string
  setId: string | null
  topic: string | null
  questionIndex: number
  question: string
  answerText: string
  result: FeedbackResult
  createdAt: string
}

export const listFeedback = async (
  payload: Payload,
  actor: User,
  options: { studentId: string; setId?: string; limit?: number },
): Promise<FeedbackView[]> => {
  const result = await payload.find({
    collection: 'ai-feedback',
    where: {
      and: [
        { student: { equals: options.studentId } },
        ...(options.setId ? [{ questionSet: { equals: options.setId } }] : []),
      ],
    },
    sort: '-createdAt',
    limit: options.limit ?? 30,
    depth: 1,
    populate: { 'question-sets': { topic: true } },
    overrideAccess: false,
    user: actor,
  })
  return result.docs.flatMap((row) => {
    const parsed = FeedbackSchema.safeParse(row.result)
    if (!parsed.success) return []
    const set = typeof row.questionSet === 'object' ? row.questionSet : null
    return [
      {
        id: row.id,
        setId: relationId(row.questionSet),
        topic: set?.topic ?? null,
        questionIndex: row.questionIndex,
        question: row.question,
        answerText: row.answerText,
        result: parsed.data,
        createdAt: row.createdAt,
      },
    ]
  })
}
