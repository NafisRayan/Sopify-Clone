import { Download, FileDown } from 'lucide-react'
import { Button } from '@/components/ui'
import { downloadCsv, type CsvColumn } from '@/lib/csv'

/** Toolbar CSV export button (Analytics parity) */
export function ExportButton<T>({
  filename,
  rows,
  columns,
  label,
  disabled,
}: {
  filename: string
  rows: T[]
  columns: CsvColumn<T>[]
  label?: string
  disabled?: boolean
}) {
  return (
    <Button
      size="sm"
      icon={<FileDown size={13} />}
      disabled={disabled || rows.length === 0}
      onClick={() => {
        downloadCsv(filename, rows, columns)
      }}
      title={disabled ? 'Nothing to export with current filters' : `Export ${rows.length} rows to CSV`}
      aria-label={label ?? 'Export CSV'}
    >
      {label ?? 'Export'}
      {disabled && <Download size={0} />}
    </Button>
  )
}
