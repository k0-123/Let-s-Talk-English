'use server'

import { revalidatePath } from 'next/cache'

import { requireUser } from '@/lib/auth'
import { importQuestionSets, type ImportReport } from '@/lib/import/run'
import { parseImportFile } from '@/lib/import/parse'
import { getPayloadClient } from '@/lib/payload'

export type ImportState = { error?: string; report?: ImportReport; fileName?: string }

const MAX_FILE_BYTES = 8 * 1024 * 1024

export async function importAction(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const admin = await requireUser(['admin'])

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a CSV or JSON file to upload.' }
  if (file.size > MAX_FILE_BYTES) return { error: 'That file is larger than 8 MB. Split it into smaller files.' }
  if (!/\.(csv|json|txt)$/i.test(file.name)) return { error: 'Only .csv and .json files are supported.' }

  const parsed = parseImportFile(file.name, await file.text())
  if (parsed.records.length === 0 && parsed.fileErrors.length === 0) {
    return { error: 'The file has no question sets in it.', fileName: file.name }
  }

  const payload = await getPayloadClient()
  const report = await importQuestionSets(payload, admin, parsed, {
    // The clicked button decides: "Check file" is a dry run, "Import" saves.
    dryRun: formData.get('intent') !== 'import',
    defaultStatus: formData.get('defaultStatus') === 'published' ? 'published' : 'draft',
    createMissingCategories: formData.get('createMissingCategories') === 'on',
  })
  if (!report.dryRun) revalidatePath('/', 'layout')
  return { report, fileName: file.name }
}
