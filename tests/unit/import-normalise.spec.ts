import { describe, expect, it } from 'vitest'

import { normaliseRecord, parseVocabularyLine } from '@/lib/import/normalise'
import { normaliseHeader, parseImportFile } from '@/lib/import/parse'

describe('parseImportFile', () => {
  it('reads a CSV with spreadsheet-style headers and multi-line cells', () => {
    const csv = [
      'Code,Category,Topic,Question 1,Answer 1,Q2,A2,Vocabulary',
      'P1-01,Part 1,Hometown,Where are you from?,"I am from Hanoi.\nIt is busy.",Do you like it?,,"bustling - busy\nlaid-back: relaxed"',
    ].join('\n')
    const parsed = parseImportFile('sets.csv', `﻿${csv}`)
    expect(parsed.format).toBe('csv')
    expect(parsed.fileErrors).toEqual([])
    expect(parsed.records).toHaveLength(1)
    expect(parsed.records[0].rowNumber).toBe(2)
    const { set, errors } = normaliseRecord(parsed.records[0].data)
    expect(errors).toEqual([])
    expect(set).toEqual({
      code: 'P1-01',
      category: 'Part 1',
      topic: 'Hometown',
      questions: [
        { question: 'Where are you from?', answer: 'I am from Hanoi.\nIt is busy.' },
        { question: 'Do you like it?' },
      ],
      vocabulary: [
        { term: 'bustling', meaning: 'busy' },
        { term: 'laid-back', meaning: 'relaxed' },
      ],
      tips: undefined,
      status: undefined,
    })
  })

  it('reads a JSON list or an object with a "sets" list', () => {
    const list = parseImportFile('x.json', JSON.stringify([{ topic: 'A', category: 'Part 1', questions: ['Q?'] }]))
    expect(list.records).toHaveLength(1)
    const wrapped = parseImportFile('x.txt', JSON.stringify({ sets: [{ topic: 'A' }, 'oops'] }))
    expect(wrapped.format).toBe('json')
    expect(wrapped.records).toHaveLength(1)
    expect(wrapped.fileErrors).toEqual(['Item 2 is not an object and was ignored.'])
  })

  it('reports broken JSON and missing headers instead of throwing', () => {
    expect(parseImportFile('x.json', '[{').fileErrors[0]).toMatch(/not valid JSON/)
    expect(parseImportFile('x.csv', 'a,b\n1,2').fileErrors[0]).toMatch(/header row/)
  })
})

describe('normaliseRecord', () => {
  it('lists every problem with a row', () => {
    const { set, errors } = normaliseRecord({ answer_2: 'An answer', status: 'live' })
    expect(set).toBeNull()
    expect(errors).toEqual([
      'Topic is missing.',
      'Category is missing.',
      'Status must be "draft" or "published" (found "live").',
      'Answer 2 has no matching question 2.',
      'At least one question is needed.',
    ])
  })

  it('accepts JSON-style questions and vocabulary objects', () => {
    const { set } = normaliseRecord({
      topic: 'Music',
      category: 'part-1',
      status: 'Published',
      questions: [{ question: 'Do you like music?', answer: 'Yes.' }, 'Why?'],
      vocabulary: [{ term: 'catchy', meaning: 'easy to remember' }, 'a playlist - a list of songs'],
    })
    expect(set?.status).toBe('published')
    expect(set?.questions).toEqual([{ question: 'Do you like music?', answer: 'Yes.' }, { question: 'Why?' }])
    expect(set?.vocabulary).toEqual([
      { term: 'catchy', meaning: 'easy to remember' },
      { term: 'a playlist', meaning: 'a list of songs' },
    ])
  })

  it('falls back to one question per line in a "questions" cell', () => {
    const { set } = normaliseRecord({ topic: 'T', category: 'C', questions: 'One?\n\nTwo?' })
    expect(set?.questions).toEqual([{ question: 'One?' }, { question: 'Two?' }])
  })
})

describe('helpers', () => {
  it('normalises headers', () => {
    expect(normaliseHeader(' Question 1 ')).toBe('question_1')
    expect(normaliseHeader('Sample-Answer_3')).toBe('sample_answer_3')
  })

  it('parses vocabulary lines', () => {
    expect(parseVocabularyLine('- a one-size-fits-all approach – the same for everyone')).toEqual({
      term: 'a one-size-fits-all approach',
      meaning: 'the same for everyone',
    })
    expect(parseVocabularyLine('24/7 = all the time')).toEqual({ term: '24/7', meaning: 'all the time' })
    expect(parseVocabularyLine('2. burnout')).toEqual({ term: 'burnout' })
    expect(parseVocabularyLine('   ')).toBeNull()
  })
})
