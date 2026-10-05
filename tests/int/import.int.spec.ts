import { readFileSync } from 'fs'
import path from 'path'
import type { Payload } from 'payload'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { importQuestionSets, type ImportOptions } from '@/lib/import/run'
import { parseImportFile } from '@/lib/import/parse'
import type { User } from '@/payload-types'
import { createCategory, createUser, getTestPayload, resetDatabase } from '../helpers/factories'

const dataDir = path.resolve(__dirname, '../../data')
const sampleCsv = readFileSync(path.join(dataDir, 'sample-question-sets.csv'), 'utf8')
const sampleJson = readFileSync(path.join(dataDir, 'sample-question-sets.json'), 'utf8')

const options = (overrides: Partial<ImportOptions> = {}): ImportOptions => ({
  dryRun: false,
  defaultStatus: 'draft',
  createMissingCategories: false,
  ...overrides,
})

let payload: Payload
let admin: User

beforeEach(async () => {
  payload = await getTestPayload()
  await resetDatabase(payload)
  admin = await createUser(payload, { role: 'admin' })
  await createCategory(payload, 'Part 1', 1)
  await createCategory(payload, 'Part 2', 2)
  await createCategory(payload, 'Part 3', 3)
})

afterAll(async () => {
  await resetDatabase(payload)
})

describe('bulk import', () => {
  it('imports all 20 sample sets from the CSV cleanly', async () => {
    const report = await importQuestionSets(payload, admin, parseImportFile('s.csv', sampleCsv), options())
    expect(report.fileErrors).toEqual([])
    expect(report.rows.filter((r) => r.outcome === 'error')).toEqual([])
    expect(report.created).toBe(20)

    const sets = await payload.find({ collection: 'question-sets', where: { code: { equals: 'P2-PERSON-01' } }, depth: 1 })
    const set = sets.docs[0]
    expect(set.status).toBe('published')
    expect(set.questions).toHaveLength(1)
    expect(set.vocabulary?.length).toBe(3)
    expect(typeof set.category === 'object' && set.category?.name).toBe('Part 2')
  })

  it('imports the same sets from JSON, and re-importing updates instead of duplicating', async () => {
    const parsed = parseImportFile('s.json', sampleJson)
    const first = await importQuestionSets(payload, admin, parsed, options())
    expect(first.created).toBe(20)
    const second = await importQuestionSets(payload, admin, parseImportFile('s.csv', sampleCsv), options())
    expect(second.created).toBe(0)
    expect(second.updated).toBe(20)
    expect((await payload.count({ collection: 'question-sets' })).totalDocs).toBe(20)
  })

  it('a dry run checks the file without saving anything', async () => {
    const report = await importQuestionSets(payload, admin, parseImportFile('s.csv', sampleCsv), options({ dryRun: true }))
    expect(report.dryRun).toBe(true)
    expect(report.created).toBe(20)
    expect((await payload.count({ collection: 'question-sets' })).totalDocs).toBe(0)
  })

  it('reports bad rows and still imports the good ones', async () => {
    const csv = [
      'code,category,topic,question_1,answer_1,status',
      'A-1,Part 1,Good set,Question?,Answer.,',
      'A-2,Part 9,Unknown category,Question?,,',
      'A-3,Part 1,,Question?,,',
      'A-1,Part 1,Duplicate code,Question?,,',
      ',Part 1,Good set,Same topic without a code?,,',
      'A-4,Part 1,Bad status,Question?,,maybe',
    ].join('\n')
    const report = await importQuestionSets(payload, admin, parseImportFile('bad.csv', csv), options())
    expect(report.created).toBe(1)
    expect(report.skipped).toBe(1)
    expect(report.failed).toBe(4)
    const byRow = Object.fromEntries(report.rows.map((r) => [r.rowNumber, r]))
    expect(byRow[2].outcome).toBe('created')
    expect(byRow[3].messages[0]).toMatch(/Category "Part 9" does not exist/)
    expect(byRow[4].messages).toContain('Topic is missing.')
    expect(byRow[5].messages[0]).toMatch(/also used on row 2/)
    expect(byRow[6].outcome).toBe('skipped')
    expect(byRow[7].messages[0]).toMatch(/Status must be/)

    const [created] = (await payload.find({ collection: 'question-sets' })).docs
    expect(created.status).toBe('draft') // default status from options
  })

  it('can create missing categories when asked', async () => {
    const csv = 'category,topic,question_1\nWriting Task 2,Essay topic,Discuss both views.'
    const dry = await importQuestionSets(payload, admin, parseImportFile('c.csv', csv), options({ dryRun: true, createMissingCategories: true }))
    expect(dry.createdCategories).toEqual(['Writing Task 2'])
    expect((await payload.count({ collection: 'categories' })).totalDocs).toBe(3)

    const real = await importQuestionSets(payload, admin, parseImportFile('c.csv', csv), options({ createMissingCategories: true }))
    expect(real.created).toBe(1)
    const categories = await payload.find({ collection: 'categories', where: { slug: { equals: 'writing-task-2' } } })
    expect(categories.totalDocs).toBe(1)
  })

  it('refuses to run for non-admins', async () => {
    const student = await createUser(payload, { role: 'student' })
    await expect(
      importQuestionSets(payload, student, parseImportFile('s.csv', sampleCsv), options()),
    ).rejects.toThrow(/Only admins/)
  })
})
