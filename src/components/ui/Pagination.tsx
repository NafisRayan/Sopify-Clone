import { Button } from './Button'

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
      <p className="text-xs text-text-muted">
        Showing <span className="font-medium text-text">{from}–{to}</span> of{' '}
        <span className="font-medium text-text">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <Button size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          Previous
        </Button>
        <span className="px-1 text-xs text-text-muted">
          Page {page} of {pages}
        </span>
        <Button size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          Next
        </Button>
      </div>
    </div>
  )
}
