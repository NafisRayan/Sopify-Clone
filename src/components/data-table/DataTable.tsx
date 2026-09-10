import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { Checkbox, Pagination, SkeletonRows, Button } from '@/components/ui'
import { EmptyState } from '@/components/ui/States'
import { useTableUrlState } from './useTableUrlState'
import { FilterBar } from './FilterBar'
import type { BulkActionDef, Column, FilterDef, FiltersState, SortState } from './types'

export interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  /** only fields in searchKeys are matched (all string fields when omitted) */
  searchKeys?: (row: T) => string[]
  filters?: FilterDef<T>[]
  selectable?: boolean
  bulkActions?: BulkActionDef[]
  rowActions?: (row: T) => ReactNode
  initialSort?: SortState
  pageSize?: number
  loading?: boolean
  /** empty because the store has nothing (vs filtered to nothing) */
  hasAnyData?: boolean
  emptyNoData?: ReactNode
  emptyNoResults?: ReactNode
  onRowClick?: (row: T) => void
  searchPlaceholder?: string
  toolbarExtra?: ReactNode
  /** hide the search input (e.g. filtered sub-lists) */
  hideControls?: boolean
  hidePagination?: boolean
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  searchKeys,
  filters = [],
  selectable,
  bulkActions = [],
  rowActions,
  initialSort,
  pageSize: initialPageSize = 25,
  loading,
  hasAnyData = true,
  emptyNoData,
  emptyNoResults,
  onRowClick,
  searchPlaceholder,
  toolbarExtra,
  hideControls,
  hidePagination,
}: DataTableProps<T>) {
  const url = useTableUrlState(filters as unknown as FilterDef<never>[], initialSort, initialPageSize)

  // ── filter + search + sort ────────────────────────────────────────────────
  const processed = useMemo(() => {
    let out = rows
    for (const f of filters) {
      const value = url.filterValues[f.key]
      if (value !== undefined) out = out.filter((row) => f.predicate(row, value))
    }
    const q = url.search.trim().toLowerCase()
    if (q) {
      out = out.filter((row) => {
        const fields = searchKeys
          ? searchKeys(row)
          : columns.map((c) => c.sortValue?.(row)).filter((v): v is string | number => typeof v === 'string' || typeof v === 'number')
        return fields.some((v) => String(v).toLowerCase().includes(q))
      })
    }
    if (url.sort) {
      const col = columns.find((c) => c.key === url.sort!.key)
      if (col?.sortValue) {
        const dir = url.sort.dir === 'asc' ? 1 : -1
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a)
          const bv = col.sortValue!(b)
          if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
          return String(av).localeCompare(String(bv)) * dir
        })
      }
    }
    return out
  }, [rows, filters, url.filterValues, url.search, url.sort, columns, searchKeys])

  const total = processed.length
  const pages = Math.max(1, Math.ceil(total / url.pageSize))
  const page = Math.min(url.page, pages)
  useEffect(() => {
    if (url.page > pages) url.setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages])

  const pageRows = useMemo(
    () => processed.slice((page - 1) * url.pageSize, page * url.pageSize),
    [processed, page, url.pageSize],
  )

  // ── selection ─────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const pageIds = pageRows.map(rowKey)
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const someOnPageSelected = pageIds.some((id) => selected.has(id))
  const selectedVisible = useMemo(
    () => processed.filter((r) => selected.has(rowKey(r))),
    [processed, selected, rowKey],
  )

  const toggleAll = () => {
    const next = new Set(selected)
    if (allOnPageSelected) pageIds.forEach((id) => next.delete(id))
    else pageIds.forEach((id) => next.add(id))
    setSelected(next)
  }
  const toggleRow = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  // drop selections that no longer exist in rows (deleted etc.)
  useEffect(() => {
    const ids = new Set(rows.map(rowKey))
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => ids.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [rows, rowKey])

  const clearSelection = () => setSelected(new Set())

  // ── responsive: stack as cards on mobile ──────────────────────────────────
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = () => setIsNarrow(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const hasActiveState = url.activeFilterCount > 0

  const bulkBar = selectable && selectedVisible.length > 0 && (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-border bg-[#f4f4f4] px-3 py-2">
      <span className="text-xs font-medium text-text">
        {selectedVisible.length} selected
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {bulkActions.map((a) => (
          <Button
            key={a.label}
            size="sm"
            onClick={() => a.onRun([...selectedVisible].map(rowKey))}
            disabled={a.disabled}
            className={a.destructive ? 'text-critical-strong' : ''}
          >
            {a.label}
          </Button>
        ))}
      </div>
      <Button size="sm" variant="tertiary" icon={<X size={13} />} onClick={clearSelection}>
        Clear
      </Button>
    </div>
  )

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {!hideControls && (
        <FilterBar
          rows={rows}
          filters={filters}
          values={url.filterValues}
          onSetFilter={url.setFilter}
          onClearAll={url.clearAllFilters}
          search={url.search}
          onSearch={url.setSearch}
          searchPlaceholder={searchPlaceholder}
          activeCount={url.activeFilterCount}
          toolbarExtra={toolbarExtra}
        />
      )}

      {bulkBar}

      {loading ? (
        <SkeletonRows rows={8} cols={Math.min(columns.length + 1, 6)} />
      ) : total === 0 ? (
        hasAnyData ? (
          <div className="border-t border-border">
            {emptyNoResults ?? (
              <EmptyState
                heading="No results found"
                message="Try a different search or remove some filters."
                primaryAction={{ label: 'Clear filters', onClick: url.clearAllFilters }}
              />
            )}
          </div>
        ) : (
          <div className="border-t border-border">{emptyNoData}</div>
        )
      ) : isNarrow ? (
        <ul className="divide-y divide-border border-t border-border" aria-label="Results">
          {pageRows.map((row) => {
            const id = rowKey(row)
            return (
              <li
                key={id}
                className={`flex items-start gap-3 px-3 py-3 ${onRowClick ? 'cursor-pointer hover:bg-surface-hover' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selectable && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(id)} onChange={() => toggleRow(id)} aria-label="Select row" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1.5">
                  {columns.map((c) => (
                    <div key={c.key} className="flex items-baseline justify-between gap-3">
                      <span className="shrink-0 text-[11px] uppercase tracking-wide text-text-subdued">
                        {typeof c.header === 'string' ? c.header : ''}
                      </span>
                      <span className="min-w-0 truncate text-right text-[13px]">{c.render(row)}</span>
                    </div>
                  ))}
                </div>
                {rowActions && <div onClick={(e) => e.stopPropagation()}>{rowActions(row)}</div>}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="overflow-x-auto border-t border-border scroll-thin">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border bg-[#fafafa] text-left text-xs text-text-muted">
                {selectable && (
                  <th scope="col" className="w-9 px-3 py-2">
                    <Checkbox
                      checked={allOnPageSelected}
                      indeterminate={someOnPageSelected && !allOnPageSelected}
                      onChange={toggleAll}
                      aria-label="Select all rows on this page"
                    />
                  </th>
                )}
                {columns.map((c) => {
                  const sortable = !!c.sortValue
                  const isSorted = url.sort?.key === c.key
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      style={{ width: c.width }}
                      className={`px-3 py-2 font-medium ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''}`}
                      aria-sort={isSorted ? (url.sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      {sortable ? (
                        <button
                          className="inline-flex items-center gap-1 hover:text-text"
                          onClick={() => url.setSort(c.key, isSorted && url.sort!.dir === 'asc' ? 'desc' : 'asc')}
                        >
                          {c.header}
                          <ArrowUpDown size={11} className={isSorted ? 'text-accent' : 'opacity-40'} />
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  )
                })}
                {rowActions && <th scope="col" className="w-10 px-3 py-2"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((row) => {
                const id = rowKey(row)
                return (
                  <tr
                    key={id}
                    className={`group ${onRowClick ? 'cursor-pointer' : ''} hover:bg-surface-hover`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.has(id)} onChange={() => toggleRow(id)} aria-label="Select row" />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-3 py-2 align-middle ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''}`}
                      >
                        {c.render(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!hidePagination && !loading && total > 0 && (
        <Pagination page={page} pageSize={url.pageSize} total={total} onPageChange={url.setPage} />
      )}
    </div>
  )
}

export type { Column, FilterDef, FiltersState, BulkActionDef }
