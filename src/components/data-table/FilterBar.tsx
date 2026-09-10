import { type ReactNode } from 'react'
import { Search, X, SlidersHorizontal, ChevronDown, CalendarRange } from 'lucide-react'
import { Popover, Button, Checkbox } from '@/components/ui'
import type { FilterDef, FiltersState, FilterValue } from './types'

function ActiveChip({
  label,
  valueLabel,
  onClear,
}: {
  label: string
  valueLabel: string
  onClear: () => void
}) {
  return (
    <button
      onClick={onClear}
      className="inline-flex max-w-[260px] items-center gap-1.5 rounded-lg border border-[#d0d0d0] bg-surface px-2 py-1 text-xs text-text hover:bg-surface-hover"
      title="Remove filter"
    >
      <span className="text-text-muted">{label}:</span>
      <span className="truncate font-medium">{valueLabel}</span>
      <X size={12} className="shrink-0 text-text-muted" />
    </button>
  )
}

function valueLabel(_f: FilterDef<never>, v: FilterValue, options: { label: string; value: string }[]): string {
  if (typeof v === 'string') return options.find((o) => o.value === v)?.label ?? v
  if (Array.isArray(v)) return v.map((x) => options.find((o) => o.value === x)?.label ?? x).join(', ')
  if ('from' in v || 'to' in v) return `${v.from ? shortDate(v.from) : 'start'} → ${v.to ? shortDate(v.to) : 'now'}`
  const numeric = v as { min?: number; max?: number }
  return `${numeric.min ?? '0'} – ${numeric.max ?? '∞'}`
}

function shortDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function FilterBar<T>({
  rows,
  filters,
  values,
  onSetFilter,
  onClearAll,
  search,
  onSearch,
  searchPlaceholder,
  activeCount,
  toolbarExtra,
  children,
}: {
  rows: T[]
  filters: FilterDef<T>[]
  values: FiltersState
  onSetFilter: (key: string, value: FilterValue | undefined) => void
  onClearAll: () => void
  search: string
  onSearch: (q: string) => void
  searchPlaceholder?: string
  activeCount: number
  toolbarExtra?: ReactNode
  /** rendered between the bar and the table (e.g. tabs) */
  children?: ReactNode
}) {
  return (
    <div className="border-b border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <div className="relative min-w-[160px] flex-1 md:max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder ?? 'Search'}
            aria-label={searchPlaceholder ?? 'Search'}
            className="h-8 w-full rounded-lg border border-[#c9c9c9] bg-[#f5f5f5] pl-8 pr-7 text-[13px] placeholder:text-text-muted hover:border-border-strong focus:border-accent focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {search && (
            <button
              onClick={() => onSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {filters.length > 0 && (
          <Popover
            panelClassName="w-72 p-0 overflow-hidden"
            trigger={
              <Button size="sm" icon={<SlidersHorizontal size={13} />}>
                Filters
                <ChevronDown size={12} />
              </Button>
            }
          >
            {() => (
              <div className="divide-y divide-border">
                {filters.map((f) => (
                  <FilterEditor key={f.key} def={f} rows={rows} value={values[f.key]} onChange={(v) => onSetFilter(f.key, v)} />
                ))}
              </div>
            )}
          </Popover>
        )}

        {toolbarExtra}

        {activeCount > 0 && (
          <Button size="sm" variant="tertiary" onClick={onClearAll}>
            Clear {activeCount > 1 ? `all (${activeCount})` : ''}
          </Button>
        )}
      </div>

      {(activeCount > 0 || children) && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2">
          {children}
          {filters.map((f) => {
            const v = values[f.key]
            if (v === undefined) return null
            const options = f.options ?? f.optionsFrom?.(rows) ?? []
            return (
              <ActiveChip
                key={f.key}
                label={f.label}
                valueLabel={valueLabel(f, v, options)}
                onClear={() => onSetFilter(f.key, undefined)}
              />
            )
          })}
          {search && (
            <ActiveChip label="Search" valueLabel={`“${search}”`} onClear={() => onSearch('')} />
          )}
        </div>
      )}
      {children && activeCount === 0 && <div className="pb-2">{null}</div>}
    </div>
  )
}

function FilterEditor<T>({
  def,
  rows,
  value,
  onChange,
}: {
  def: FilterDef<T>
  rows: T[]
  value: FilterValue | undefined
  onChange: (v: FilterValue | undefined) => void
}) {
  const options = def.options ?? def.optionsFrom?.(rows) ?? []
  return (
    <div className="px-3 py-2.5">
      <div className="mb-1.5 text-xs font-semibold text-text">{def.label}</div>
      {def.type === 'select' && (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="h-8 w-full rounded-lg border border-[#c9c9c9] bg-surface px-2 text-[13px] focus:border-accent focus:outline-none"
        >
          <option value="">All</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      {def.type === 'multiselect' && (
        <div className="max-h-44 space-y-1 overflow-y-auto scroll-thin">
          {options.map((o) => {
            const selected = Array.isArray(value) && value.includes(o.value)
            return (
              <Checkbox
                key={o.value}
                label={o.label}
                checked={selected}
                onChange={() => {
                  const current = Array.isArray(value) ? value : []
                  const next = selected ? current.filter((x) => x !== o.value) : [...current, o.value]
                  onChange(next.length ? next : undefined)
                }}
              />
            )
          })}
          {options.length === 0 && <p className="text-xs text-text-muted">No options</p>}
        </div>
      )}
      {def.type === 'boolean' && (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="h-8 w-full rounded-lg border border-[#c9c9c9] bg-surface px-2 text-[13px] focus:border-accent focus:outline-none"
        >
          <option value="">All</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )}
      {def.type === 'date-range' && (
        <div className="flex items-center gap-1.5">
          <CalendarRange size={14} className="shrink-0 text-text-muted" />
          <input
            type="date"
            value={(value as { from?: string })?.from ?? ''}
            onChange={(e) => onChange({ ...(value as object), from: e.target.value || undefined } as FilterValue)}
            className="h-8 w-full rounded-lg border border-[#c9c9c9] px-2 text-xs focus:border-accent focus:outline-none"
            aria-label={`${def.label} from`}
          />
          <span className="text-text-muted">–</span>
          <input
            type="date"
            value={(value as { to?: string })?.to ?? ''}
            onChange={(e) => onChange({ ...(value as object), to: e.target.value || undefined } as FilterValue)}
            className="h-8 w-full rounded-lg border border-[#c9c9c9] px-2 text-xs focus:border-accent focus:outline-none"
            aria-label={`${def.label} to`}
          />
        </div>
      )}
      {def.type === 'number-range' && (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="Min"
            value={(value as { min?: number })?.min ?? ''}
            onChange={(e) => onChange({ ...(value as object), min: e.target.value === '' ? undefined : Number(e.target.value) } as FilterValue)}
            className="h-8 w-full rounded-lg border border-[#c9c9c9] px-2 text-xs focus:border-accent focus:outline-none"
            aria-label={`${def.label} minimum`}
          />
          <span className="text-text-muted">–</span>
          <input
            type="number"
            placeholder="Max"
            value={(value as { max?: number })?.max ?? ''}
            onChange={(e) => onChange({ ...(value as object), max: e.target.value === '' ? undefined : Number(e.target.value) } as FilterValue)}
            className="h-8 w-full rounded-lg border border-[#c9c9c9] px-2 text-xs focus:border-accent focus:outline-none"
            aria-label={`${def.label} maximum`}
          />
        </div>
      )}
    </div>
  )
}
