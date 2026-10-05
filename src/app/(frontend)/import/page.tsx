import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'

import { ImportForm } from './import-form'

export const metadata: Metadata = { title: 'Bulk import' }

export default async function ImportPage() {
  await requireUser(['admin'])

  return (
    <div>
      <PageHeader
        title="Bulk import question sets"
        description="Upload a spreadsheet saved as CSV, or a JSON file. Check it first: nothing is saved until you choose Import."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href="/question-sets-template.csv" download>
                Download CSV template
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/collections/question-sets">View all sets</Link>
            </Button>
          </>
        }
      />
      <details className="mb-6 rounded-md border bg-card p-4 text-sm">
        <summary className="font-medium">How to fill in the file</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>One row per question set. The first row must be the column names.</li>
          <li>
            Required: <code>category</code> (name or slug, e.g. &quot;Part 1&quot;), <code>topic</code> and{' '}
            <code>question_1</code>. Add <code>question_2</code>, <code>question_3</code>… as needed.
          </li>
          <li>
            Optional: <code>answer_1</code>, <code>answer_2</code>… (sample answers), <code>vocabulary</code> (one
            &quot;word - meaning&quot; per line), <code>tips</code>, <code>status</code> (draft or published).
          </li>
          <li>
            <code>code</code> is an optional unique reference like P1-WORK-01. Importing a row with an existing code
            updates that set instead of creating a copy.
          </li>
          <li>Rows with problems are listed and skipped; all other rows are still imported.</li>
        </ul>
      </details>
      <ImportForm />
    </div>
  )
}
