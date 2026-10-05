import { z } from 'zod'

/** Shape of Claude's feedback. Client-safe (no server imports), shared by the API call, storage and the UI. */

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

