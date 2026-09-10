import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { FiltersState, FilterValue, SortState } from './types'
import type { FilterDef } from './types'

/**
 * Search/filters/sort/page ↔ URL query params (spec §56).
 * Params: q, sort, dir, page, f_<key> per active filter.
 */

function encodeFilter(value: FilterValue): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.join(',')
  if ('from' in value || 'to' in value) return [value.from ?? '', value.to ?? ''].join('..')
  const numeric = value as { min?: number; max?: number }
  return [numeric.min ?? '', numeric.max ?? ''].join('..')
}

function decodeFilter(raw: string, type: FilterDef<never>['type']): FilterValue | undefined {
  if (!raw) return undefined
  if (type === 'multiselect') return raw.split(',').filter(Boolean)
  if (type === 'date-range') {
    const [from, to] = raw.split('..')
    return { from: from || undefined, to: to || undefined }
  }
  if (type === 'number-range') {
    const [min, max] = raw.split('..')
    return {
      min: min !== '' && min !== undefined ? Number(min) : undefined,
      max: max !== '' && max !== undefined ? Number(max) : undefined,
    }
  }
  return raw
}

export function useTableUrlState(filters: FilterDef<never>[], initialSort?: SortState, defaultPageSize = 25) {
  const [params, setParams] = useSearchParams()

  const search = params.get('q') ?? ''
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)
  const pageSize = Number(params.get('perPage') ?? String(defaultPageSize))
  const sort: SortState | undefined = params.get('sort')
    ? { key: params.get('sort')!, dir: (params.get('dir') as 'asc' | 'desc') ?? 'asc' }
    : initialSort

  const filterValues = useMemo<FiltersState>(() => {
    const values: FiltersState = {}
    for (const f of filters) {
      const raw = params.get(`f_${f.key}`)
      const decoded = raw !== null ? decodeFilter(raw, f.type) : undefined
      if (decoded !== undefined && !(typeof decoded === 'string' && decoded === '')) {
        values[f.key] = decoded as FilterValue
      } else if (Array.isArray(decoded) && decoded.length === 0) {
        // keep empty arrays out
      } else if (decoded !== undefined) {
        values[f.key] = decoded
      }
    }
    return values
  }, [params, filters])

  const push = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(params)
      mutate(next)
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  const setSearch = useCallback((q: string) => push((p) => { q ? p.set('q', q) : p.delete('q'); p.delete('page') }), [push])
  const setPage = useCallback((n: number) => push((p) => (n > 1 ? p.set('page', String(n)) : p.delete('page'))), [push])
  const setPageSize = useCallback((n: number) => push((p) => { p.set('perPage', String(n)); p.delete('page') }), [push])
  const setSort = useCallback(
    (key: string, dir: 'asc' | 'desc') => push((p) => { p.set('sort', key); p.set('dir', dir); p.delete('page') }),
    [push],
  )
  const clearSort = useCallback(() => push((p) => { p.delete('sort'); p.delete('dir') }), [push])

  const setFilter = useCallback(
    (key: string, value: FilterValue | undefined) =>
      push((p) => {
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          p.delete(`f_${key}`)
        } else {
          p.set(`f_${key}`, encodeFilter(value))
        }
        p.delete('page')
      }),
    [push],
  )

  const clearAllFilters = useCallback(
    () => push((p) => {
      for (const key of [...p.keys()]) if (key.startsWith('f_')) p.delete(key)
      p.delete('q')
      p.delete('page')
    }),
    [push],
  )

  const activeFilterCount =
    Object.keys(filterValues).length + (search ? 1 : 0)

  return {
    search, setSearch,
    page, setPage,
    pageSize, setPageSize,
    sort, setSort, clearSort,
    filterValues, setFilter, clearAllFilters,
    activeFilterCount,
    hasState: params.size > 0,
  }
}
