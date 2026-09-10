import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Search, Package, Tag, UserRound, Layers, TicketPercent, Building2, Gift, PieChart, Truck, CornerDownLeft, Clock } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useStore } from '@/store/useStore'
import { globalSearch, getRecentSearches, pushRecentSearch, totalResults, type SearchResult } from '@/lib/search'
import { Badge } from '@/components/ui'

const groupIcon = {
  product: Tag,
  order: Package,
  customer: UserRound,
  collection: Layers,
  discount: TicketPercent,
  company: Building2,
  giftcard: Gift,
  segment: PieChart,
  transfer: Truck,
} as const

export function GlobalSearch() {
  const open = useUiStore((s) => s.globalSearchOpen)
  const setOpen = useUiStore((s) => s.setGlobalSearchOpen)
  const state = useStore()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const groups = useMemo(() => globalSearch(query, state), [query, state])
  const flat = useMemo(() => groups.flatMap((g) => g.results), [groups])
  const recent = useMemo(() => (query.trim() === '' ? getRecentSearches() : []), [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  if (!open) return null

  const go = (r: SearchResult) => {
    pushRecentSearch(query)
    setOpen(false)
    navigate(r.href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const r = flat[active]
      if (r) go(r)
      else if (query.trim()) {
        pushRecentSearch(query)
        setOpen(false)
        navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  let flatIndex = -1

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" onClick={() => setOpen(false)} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="absolute left-1/2 top-[12vh] w-[92%] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search size={15} className="shrink-0 text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search orders, products, customers…"
            aria-label="Search"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-xs text-text-muted hover:text-text" aria-label="Clear">
              Clear
            </button>
          )}
          <kbd className="hidden shrink-0 rounded border border-border bg-[#f6f6f6] px-1.5 py-0.5 text-[10px] text-text-muted sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto py-1.5 scroll-thin">
          {query.trim() === '' && (
            <div>
              {recent.length > 0 && (
                <div className="px-3 pb-1 pt-1">
                  <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-subdued">Recent searches</p>
                  {recent.map((r) => (
                    <button
                      key={r}
                      onClick={() => setQuery(r)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-text-muted hover:bg-surface-hover"
                    >
                      <Clock size={13} />
                      {r}
                    </button>
                  ))}
                </div>
              )}
              <div className="px-4 py-6 text-center">
                <p className="text-[13px] text-text-muted">
                  Search products, orders, customers, collections and discounts.
                </p>
                <p className="mt-1 text-xs text-text-subdued">
                  Tip: press <kbd className="rounded border border-border bg-[#f6f6f6] px-1">/</kbd> anywhere to search
                </p>
              </div>
            </div>
          )}

          {query.trim() !== '' && flat.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-text">No results for “{query}”</p>
              <p className="mt-1 text-xs text-text-muted">Check the spelling or try a more general term.</p>
            </div>
          )}

          {groups.map((group) => {
            const Icon = groupIcon[group.type]
            return (
              <div key={group.type} className="px-1.5 pb-1">
                <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-text-subdued">
                  {group.label}
                </p>
                {group.results.map((r) => {
                  flatIndex++
                  const isActive = flatIndex === active
                  return (
                    <button
                      key={r.id}
                      onMouseEnter={() => setActive(flatIndex)}
                      onClick={() => go(r)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left ${
                        isActive ? 'bg-accent-surface' : 'hover:bg-surface-hover'
                      }`}
                    >
                      {r.imageSrc ? (
                        <img src={r.imageSrc} alt="" className="h-8 w-8 shrink-0 rounded-md border border-border object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f1f1f1] text-text-muted">
                          <Icon size={15} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-text">{r.title}</span>
                        <span className="block truncate text-xs text-text-muted">{r.subtitle}</span>
                      </span>
                      {isActive && <CornerDownLeft size={13} className="shrink-0 text-text-muted" />}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {query.trim() !== '' && flat.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-text-muted">
            <Badge tone="neutral">{totalResults(groups)} results</Badge>
            <span>
              <kbd className="rounded border border-border bg-[#f6f6f6] px-1">↑↓</kbd> navigate ·{' '}
              <kbd className="rounded border border-border bg-[#f6f6f6] px-1">↵</kbd> open
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
