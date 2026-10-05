'use client'

import { useActionState } from 'react'

import { FormField } from '@/components/form-field'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import type { RowReport } from '@/lib/import/run'

import { importAction, type ImportState } from './actions'

const outcomeLabel: Record<RowReport['outcome'], { text: string; dryText: string; variant: 'success' | 'secondary' | 'outline' }> = {
  created: { text: 'Created', dryText: 'Will be created', variant: 'success' },
  updated: { text: 'Updated', dryText: 'Will update', variant: 'secondary' },
  skipped: { text: 'Skipped', dryText: 'Will be skipped', variant: 'outline' },
  error: { text: 'Error', dryText: 'Error', variant: 'outline' },
}

const Report = ({ state }: { state: ImportState }) => {
  const report = state.report
  if (!report) return null
  const unit = report.format === 'csv' ? 'Row' : 'Item'
  const problems = report.rows.filter((r) => r.outcome !== 'created' || r.messages.length > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{report.dryRun ? 'Check results (nothing saved yet)' : 'Import finished'}</CardTitle>
        <p className="text-sm text-muted-foreground">{state.fileName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {[
            ['Created', report.created, report.dryRun ? 'will be created' : 'created'],
            ['Updated', report.updated, report.dryRun ? 'will be updated' : 'updated'],
            ['Skipped', report.skipped, 'skipped'],
            ['Errors', report.failed, 'with errors'],
          ].map(([label, value, text]) => (
            <div key={label} className="rounded-md border p-3">
              <dt className="sr-only">{label}</dt>
              <dd className="text-2xl font-bold">{value}</dd>
              <dd className="text-xs text-muted-foreground">{text}</dd>
            </div>
          ))}
        </dl>

        {report.createdCategories.length > 0 && (
          <Alert variant="info">
            {report.dryRun ? 'New categories that will be created: ' : 'New categories created: '}
            {report.createdCategories.join(', ')}
          </Alert>
        )}
        {report.fileErrors.length > 0 && (
          <Alert variant="destructive">
            <ul className="list-disc space-y-1 pl-4">
              {report.fileErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Alert>
        )}

        {report.failed === 0 && report.fileErrors.length === 0 && (
          <Alert variant="success">
            {report.dryRun
              ? 'No problems found. Choose "Import" to save these sets.'
              : 'All rows were imported without errors.'}
          </Alert>
        )}

        {problems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">{unit}</th>
                  <th className="py-2 pr-3">Topic</th>
                  <th className="py-2 pr-3">Result</th>
                  <th className="py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((row) => {
                  const label = outcomeLabel[row.outcome]
                  return (
                    <tr key={row.rowNumber} className="border-b align-top last:border-0">
                      <td className="py-2 pr-3 font-mono">{row.rowNumber}</td>
                      <td className="py-2 pr-3">{row.topic || <span className="text-muted-foreground">—</span>}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={label.variant} className={row.outcome === 'error' ? 'border-destructive text-destructive' : ''}>
                          {report.dryRun ? label.dryText : label.text}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <ul className="space-y-1">
                          {row.messages.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const ImportForm = () => {
  const [state, action, pending] = useActionState<ImportState, FormData>(importAction, {})

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-5 sm:pt-6">
          <form action={action} className="space-y-5">
            {state.error && <Alert variant="destructive">{state.error}</Alert>}
            <FormField id="file" label="File (.csv or .json)">
              <Input id="file" name="file" type="file" accept=".csv,.json,text/csv,application/json" required />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="defaultStatus"
                label="Status for new sets"
                hint='Used when the file has no "status" column.'
              >
                <NativeSelect id="defaultStatus" name="defaultStatus" defaultValue="draft">
                  <option value="draft">Draft (hidden from students)</option>
                  <option value="published">Published (visible straight away)</option>
                </NativeSelect>
              </FormField>
              <label className="flex items-start gap-3 rounded-md border p-3 text-sm sm:mt-6">
                <input type="checkbox" name="createMissingCategories" className="mt-0.5 size-4" />
                <span>
                  <span className="font-medium">Create missing categories</span>
                  <span className="block text-muted-foreground">
                    Otherwise rows with an unknown category are reported as errors.
                  </span>
                </span>
              </label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" name="intent" value="check" variant="outline" disabled={pending}>
                {pending ? 'Working…' : 'Check file'}
              </Button>
              <Button type="submit" name="intent" value="import" disabled={pending}>
                {pending ? 'Working…' : 'Import'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Report state={state} />
    </div>
  )
}
