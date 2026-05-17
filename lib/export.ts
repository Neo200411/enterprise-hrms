/**
 * Lightweight CSV export utility — no external dependencies.
 * Converts an array of objects to a downloadable CSV file.
 */

/** Escape a single CSV cell value */
function escapeCell(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Wrap in quotes if it contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** Convert array of objects to CSV string */
export function toCsv(rows: Record<string, any>[], columns: { key: string; label: string }[]): string {
  const header = columns.map(c => escapeCell(c.label)).join(',')
  const body = rows.map(row =>
    columns.map(c => escapeCell(row[c.key])).join(',')
  ).join('\n')
  return `${header}\n${body}`
}

/** Trigger a browser download of the given CSV string */
export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
