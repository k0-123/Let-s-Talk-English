/**
 * Bulk-import question sets from the command line.
 *
 *   npm run import:sets -- data/sample-question-sets.csv            # import
 *   npm run import:sets -- data/sample-question-sets.csv --dry-run  # check only
 *   npm run import:sets -- file.csv --publish --create-categories
 *
 * Uses the same importer as the admin's /import page.
 */
import 'dotenv/config'

import { readFileSync } from 'fs'
import path from 'path'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { importQuestionSets } from '../src/lib/import/run'
import { parseImportFile } from '../src/lib/import/parse'

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--'))
if (!file) {
  console.error('Usage: npm run import:sets -- <file.csv|file.json> [--dry-run] [--publish] [--create-categories]')
  process.exit(1)
}

const payload = await getPayload({ config })
const parsed = parseImportFile(file, readFileSync(path.resolve(file), 'utf8'))
const report = await importQuestionSets(payload, null, parsed, {
  dryRun: args.includes('--dry-run'),
  defaultStatus: args.includes('--publish') ? 'published' : 'draft',
  createMissingCategories: args.includes('--create-categories'),
})

for (const message of report.fileErrors) console.log(`File: ${message}`)
for (const row of report.rows.filter((r) => r.outcome !== 'created')) {
  console.log(`${parsed.format === 'csv' ? 'Row' : 'Item'} ${row.rowNumber} [${row.outcome}] ${row.topic ?? ''}`)
  for (const message of row.messages) console.log(`   - ${message}`)
}
console.log(
  `\n${report.dryRun ? 'DRY RUN (nothing saved): ' : ''}${report.total} rows: ${report.created} created, ${report.updated} updated, ${report.skipped} skipped, ${report.failed} with errors.`,
)
if (report.createdCategories.length) console.log(`New categories: ${report.createdCategories.join(', ')}`)
process.exit(report.failed > 0 ? 2 : 0)
