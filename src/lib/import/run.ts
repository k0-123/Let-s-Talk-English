import type { Payload } from 'payload'

import { isAdmin, relationId } from '@/access'
import { slugify } from '@/lib/slugify'
import type { Category, QuestionSet, User } from '@/payload-types'

import { normaliseRecord, type CandidateSet } from './normalise'
import type { ParseResult } from './parse'

export type ImportOptions = {
  /** Check the file and report what would happen, without saving anything. */
  dryRun: boolean
  /** Status for new sets when the file has no status column. */
  defaultStatus: 'draft' | 'published'
  /** Create categories that do not exist yet instead of rejecting the row. */
  createMissingCategories: boolean
}

export type RowOutcome = 'created' | 'updated' | 'skipped' | 'error'

export type RowReport = {
  rowNumber: number
  topic: string | null
  outcome: RowOutcome
  messages: string[]
}

export type ImportReport = {
  dryRun: boolean
  format: ParseResult['format']
  total: number
  created: number
  updated: number
  skipped: number
  failed: number
  createdCategories: string[]
  fileErrors: string[]
  rows: RowReport[]
}

type ExistingSet = Pick<QuestionSet, 'id' | 'topic' | 'code' | 'status'> & { categoryId: string | null }

const topicKey = (categoryId: string, topic: string) => `${categoryId}::${topic.trim().toLowerCase()}`

/**
 * Imports question sets from a parsed CSV/JSON file. Bad rows are reported and
 * skipped; good rows are saved. Rows with a `code` that already exists update
 * that set, so the same file can be imported again safely.
 *
 * Pass the admin user from the web UI. Pass `null` only from trusted scripts.
 */
export const importQuestionSets = async (
  payload: Payload,
  user: User | null,
  parsed: ParseResult,
  options: ImportOptions,
): Promise<ImportReport> => {
  if (user && !isAdmin(user)) throw new Error('Only admins can import question sets.')
  const access = user ? ({ overrideAccess: false, user } as const) : ({ overrideAccess: true } as const)

  const report: ImportReport = {
    dryRun: options.dryRun,
    format: parsed.format,
    total: parsed.records.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    createdCategories: [],
    fileErrors: [...parsed.fileErrors],
    rows: [],
  }

  // Load categories and existing sets once; 500+ sets is still small.
  const categories = (
    await payload.find({ collection: 'categories', pagination: false, depth: 0, ...access })
  ).docs
  const categoryByKey = new Map<string, Category>()
  const indexCategory = (category: Category) => {
    categoryByKey.set(category.slug.toLowerCase(), category)
    categoryByKey.set(category.name.trim().toLowerCase(), category)
  }
  categories.forEach(indexCategory)

  const existing = (
    await payload.find({
      collection: 'question-sets',
      pagination: false,
      depth: 0,
      select: { topic: true, code: true, status: true, category: true },
      ...access,
    })
  ).docs.map<ExistingSet>((set) => ({
    id: set.id,
    topic: set.topic,
    code: set.code,
    status: set.status,
    categoryId: relationId(set.category),
  }))
  const byCode = new Map(existing.filter((s) => s.code).map((s) => [s.code!.toLowerCase(), s]))
  const byTopic = new Map(existing.filter((s) => s.categoryId).map((s) => [topicKey(s.categoryId!, s.topic), s]))

  const codesInFile = new Map<string, number>()

  const resolveCategory = async (
    name: string,
  ): Promise<{ category: Pick<Category, 'id' | 'name'> | null; error?: string }> => {
    const found = categoryByKey.get(name.trim().toLowerCase()) ?? categoryByKey.get(slugify(name))
    if (found) return { category: found }
    if (!options.createMissingCategories) {
      return {
        category: null,
        error: `Category "${name}" does not exist. Create it in the admin panel first, or tick "Create missing categories".`,
      }
    }
    if (!report.createdCategories.includes(name)) report.createdCategories.push(name)
    if (options.dryRun) {
      // Pretend it exists so the rest of the row is still checked.
      const placeholder = { id: `new:${slugify(name)}`, name, slug: slugify(name) } as Category
      indexCategory(placeholder)
      return { category: placeholder }
    }
    const created = await payload.create({
      collection: 'categories',
      data: { name, slug: slugify(name), order: categories.length + report.createdCategories.length },
      ...access,
    })
    indexCategory(created)
    return { category: created }
  }

  const toData = (set: CandidateSet, categoryId: string, status: 'draft' | 'published') => ({
    topic: set.topic,
    category: categoryId,
    status,
    questions: set.questions.map((q) => ({ question: q.question, answer: q.answer ?? null })),
    vocabulary: set.vocabulary.map((v) => ({ term: v.term, meaning: v.meaning ?? null })),
    tips: set.tips ?? null,
    code: set.code ?? null,
  })

  for (const record of parsed.records) {
    const { set, errors } = normaliseRecord(record.data)
    const row: RowReport = {
      rowNumber: record.rowNumber,
      topic: set?.topic ?? (typeof record.data.topic === 'string' ? record.data.topic : null),
      outcome: 'error',
      messages: [...errors],
    }
    report.rows.push(row)

    if (!set) {
      report.failed++
      continue
    }

    if (set.code) {
      const key = set.code.toLowerCase()
      const firstRow = codesInFile.get(key)
      if (firstRow) {
        row.messages.push(`Code "${set.code}" is also used on row ${firstRow}. Codes must be unique.`)
        report.failed++
        continue
      }
      codesInFile.set(key, record.rowNumber)
    }

    try {
      const { category, error } = await resolveCategory(set.category)
      if (!category) {
        row.messages.push(error!)
        report.failed++
        continue
      }

      const match = set.code ? byCode.get(set.code.toLowerCase()) : undefined
      if (match) {
        const status = set.status ?? match.status ?? options.defaultStatus
        if (!options.dryRun) {
          await payload.update({
            collection: 'question-sets',
            id: match.id,
            data: toData(set, category.id, status),
            ...access,
          })
        }
        row.outcome = 'updated'
        row.messages.push(`Updates the existing set with code "${set.code}".`)
        report.updated++
        continue
      }

      const duplicate = byTopic.get(topicKey(category.id, set.topic))
      if (!set.code && duplicate) {
        row.outcome = 'skipped'
        row.messages.push(
          `A set called "${set.topic}" already exists in ${category.name}. Give the row a code to update it instead.`,
        )
        report.skipped++
        continue
      }

      const status = set.status ?? options.defaultStatus
      if (!options.dryRun) {
        const created = await payload.create({
          collection: 'question-sets',
          data: toData(set, category.id, status),
          ...access,
        })
        const entry: ExistingSet = { ...created, categoryId: category.id }
        if (created.code) byCode.set(created.code.toLowerCase(), entry)
        byTopic.set(topicKey(category.id, created.topic), entry)
      } else {
        byTopic.set(topicKey(category.id, set.topic), {
          id: 'dry-run',
          topic: set.topic,
          code: set.code,
          status,
          categoryId: category.id,
        })
      }
      row.outcome = 'created'
      report.created++
    } catch (error) {
      row.outcome = 'error'
      row.messages.push(`Could not be saved: ${(error as Error).message}`)
      report.failed++
    }
  }

  return report
}
