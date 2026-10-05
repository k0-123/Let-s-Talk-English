import Papa from 'papaparse'

export type RawRecord = Record<string, unknown>

export type ParsedRecord = {
  /** Spreadsheet row number for CSV (header is row 1), item number for JSON. */
  rowNumber: number
  data: RawRecord
}

export type ParseResult = {
  format: 'csv' | 'json'
  records: ParsedRecord[]
  fileErrors: string[]
}

/** "Question 1", "question-1" and "QUESTION_1" all become "question_1". */
export const normaliseHeader = (header: string): string =>
  header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const normaliseKeys = (record: RawRecord): RawRecord =>
  Object.fromEntries(Object.entries(record).map(([key, value]) => [normaliseHeader(key), value]))

const parseJson = (content: string): ParseResult => {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    return { format: 'json', records: [], fileErrors: [`The file is not valid JSON: ${(error as Error).message}`] }
  }

  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { sets?: unknown }).sets)
      ? (parsed as { sets: unknown[] }).sets
      : null

  if (!list) {
    return {
      format: 'json',
      records: [],
      fileErrors: ['The JSON file must contain a list of question sets, or an object with a "sets" list.'],
    }
  }

  const records: ParsedRecord[] = []
  const fileErrors: string[] = []
  list.forEach((item, index) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      records.push({ rowNumber: index + 1, data: normaliseKeys(item as RawRecord) })
    } else {
      fileErrors.push(`Item ${index + 1} is not an object and was ignored.`)
    }
  })
  return { format: 'json', records, fileErrors }
}

const parseCsv = (content: string): ParseResult => {
  const result = Papa.parse<RawRecord>(content, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: normaliseHeader,
  })

  const fileErrors = result.errors
    .filter((error) => error.code !== 'UndetectableDelimiter')
    .map((error) =>
      typeof error.row === 'number' ? `Row ${error.row + 2}: ${error.message}` : error.message,
    )

  const headers = result.meta.fields ?? []
  if (!headers.includes('topic') && !headers.includes('title')) {
    fileErrors.unshift(
      'The first row must be a header row with at least "category", "topic" and "question_1" columns.',
    )
  }

  return {
    format: 'csv',
    records: result.data.map((data, index) => ({ rowNumber: index + 2, data })),
    fileErrors,
  }
}

export const parseImportFile = (fileName: string, rawContent: string): ParseResult => {
  const content = rawContent.replace(/^﻿/, '')
  const looksLikeJson = /\.json$/i.test(fileName) || /^\s*[[{]/.test(content)
  return looksLikeJson ? parseJson(content) : parseCsv(content)
}
