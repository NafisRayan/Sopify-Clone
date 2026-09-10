import { useStore } from '@/store/useStore'
import type { ID } from '@/types'

/**
 * Global search across products/orders/customers/collections/discounts (spec §8).
 * Plain contains-match across relevant fields, grouped by entity type.
 */

export interface SearchResult {
  id: ID
  title: string
  subtitle: string
  icon: 'product' | 'order' | 'customer' | 'collection' | 'discount'
  href: string
  imageSrc?: string
}

export interface SearchGroup {
  type: SearchResult['icon']
  label: string
  results: SearchResult[]
}

export function globalSearch(query: string, state = useStore.getState()): SearchGroup[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  // token AND-match: "blue shirt" matches "Classic Blue Shirt" (spec §8)
  const tokens = q.split(/\s+/)

  const matches = (...fields: (string | undefined | string[])[]) =>
    tokens.every((t) =>
      fields.some((f) =>
        Array.isArray(f) ? f.some((x) => x.toLowerCase().includes(t)) : f?.toLowerCase().includes(t),
      ),
    )

  const products: SearchResult[] = state.products
    .filter((p) =>
      matches(
        p.title,
        p.vendor,
        p.productType,
        p.tags,
        p.seo.handle,
        p.variants.map((v) => v.title),
        p.variants.map((v) => v.sku),
      ),
    )
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: `${p.status.charAt(0).toUpperCase() + p.status.slice(1)} · ${p.productType || 'Uncategorized'}`,
      icon: 'product',
      href: `/products/${p.id}`,
      imageSrc: p.media[0]?.src,
    }))

  const customerName = (c: (typeof state.customers)[number]) => `${c.firstName} ${c.lastName}`.toLowerCase()

  const orders: SearchResult[] = state.orders
    .filter((o) => {
      const cust = state.customers.find((c) => c.id === o.customerId)
      return matches(o.name, o.email, cust && customerName(cust), cust && `${cust.firstName} ${cust.lastName}`, o.tags)
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((o) => {
      const cust = state.customers.find((c) => c.id === o.customerId)
      return {
        id: o.id,
        title: o.name,
        subtitle: `${cust && customerName(cust) ? `${cust.firstName} ${cust.lastName}` : o.email} · ${o.total.toFixed(2)}`,
        icon: 'order' as const,
        href: `/orders/${o.id}`,
      }
    })

  const customers: SearchResult[] = state.customers
    .filter((c) => matches(customerName(c), c.email, c.phone, c.defaultAddress?.city))
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      title: `${c.firstName} ${c.lastName}`,
      subtitle: c.email,
      icon: 'customer',
      href: `/customers/${c.id}`,
    }))

  const collections: SearchResult[] = state.collections
    .filter((c) => c.title.toLowerCase().includes(q) || c.handle.includes(q))
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: `${c.type === 'smart' ? 'Automated' : 'Manual'} · ${c.productIds.length} products`,
      icon: 'collection',
      href: `/collections/${c.id}`,
      imageSrc: c.imageSrc,
    }))

  const discounts: SearchResult[] = state.discounts
    .filter((d) => d.code.toLowerCase().includes(q) || d.title.toLowerCase().includes(q))
    .slice(0, 4)
    .map((d) => ({
      id: d.id,
      title: d.code,
      subtitle: d.title,
      icon: 'discount',
      href: `/discounts/${d.id}`,
    }))

  const groups: SearchGroup[] = [
    { type: 'product', label: 'Products', results: products },
    { type: 'order', label: 'Orders', results: orders },
    { type: 'customer', label: 'Customers', results: customers },
    { type: 'collection', label: 'Collections', results: collections },
    { type: 'discount', label: 'Discounts', results: discounts },
  ]
  return groups.filter((g) => g.results.length > 0)
}

export function totalResults(groups: SearchGroup[]): number {
  return groups.reduce((s, g) => s + g.results.length, 0)
}

const RECENT_KEY = 'northstar-recent-searches'

export function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function pushRecentSearch(q: string): void {
  if (!q.trim()) return
  const next = [q, ...getRecentSearches().filter((s) => s !== q)].slice(0, 5)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}
