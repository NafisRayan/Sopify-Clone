import type { ReactNode } from 'react'

export interface SortState {
  key: string
  dir: 'asc' | 'desc'
}

export type FilterValue = string | string[] | { from?: string; to?: string } | { min?: number; max?: number }

export interface FilterOption {
  label: string
  value: string
}

export interface FilterDef<T> {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'date-range' | 'number-range' | 'boolean'
  options?: FilterOption[]
  /** derive options from the data (e.g. all vendors present) */
  optionsFrom?: (rows: T[]) => FilterOption[]
  /** must handle the same value shape it produces */
  predicate: (row: T, value: FilterValue) => boolean
}

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
  width?: string
  /** hide on <lg screens */
  hideOnMobile?: boolean
}

export interface BulkActionDef {
  label: string
  onRun: (ids: string[]) => void | Promise<void>
  destructive?: boolean
  disabled?: boolean
  icon?: ReactNode
}

export type FiltersState = Record<string, FilterValue>
