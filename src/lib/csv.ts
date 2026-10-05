/** Minimal RFC 4180 CSV writer. Cells starting with = + - @ are prefixed so spreadsheets don't run them as formulas. */
const cell = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const toCsv = (header: string[], rows: unknown[][]): string =>
  [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n'
