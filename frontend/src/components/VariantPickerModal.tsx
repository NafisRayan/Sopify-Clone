import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { variantAvailable } from '@/store/selectors'
import { Badge, Button, Modal, Input } from '@/components/ui'
import { formatMoney } from '@/lib/format'

export interface PickedVariant {
  variantId: string
  productId: string
  title: string
  variantTitle: string
  sku: string
  price: number
  quantity: number
  imageSrc?: string
}

/** Searchable variant picker with quantity — shared by order edit and transfers */
export function VariantPickerModal({
  open,
  onClose,
  onPick,
  title = 'Add item',
}: {
  open: boolean
  onClose: () => void
  onPick: (picked: PickedVariant) => void
  title?: string
}) {
  const products = useStore((s) => s.products)
  const [query, setQuery] = useState('')
  const [qty, setQty] = useState('1')

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out: { productId: string; productTitle: string; imageSrc?: string; variantId: string; variantTitle: string; sku: string; price: number }[] = []
    for (const p of products) {
      if (p.status === 'archived') continue
      const productMatch = !q || p.title.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q)
      for (const v of p.variants) {
        if (!v.available) continue
        const variantMatch = v.sku.toLowerCase().includes(q) || v.title.toLowerCase().includes(q)
        if (!q || productMatch || variantMatch) {
          out.push({
            productId: p.id, productTitle: p.title, imageSrc: p.media[0]?.src,
            variantId: v.id, variantTitle: v.title === 'Default Title' ? '' : v.title,
            sku: v.sku, price: v.price,
          })
        }
      }
    }
    return out.slice(0, 40)
  }, [products, query])

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products or SKUs"
            aria-label="Search products"
            className="h-8 w-full rounded-lg border border-[#c9c9c9] pl-8 pr-3 text-[13px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <ul className="max-h-72 divide-y divide-border overflow-y-auto rounded-lg border border-border scroll-thin">
          {candidates.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-text-muted">Nothing matches.</li>}
          {candidates.map((c) => (
            <li key={c.variantId} className="flex items-center gap-3 px-3 py-2">
              {c.imageSrc && <img src={c.imageSrc} alt="" className="h-8 w-8 shrink-0 rounded-md border border-border object-cover" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{c.productTitle}</span>
                <span className="block truncate text-xs text-text-muted">
                  {c.variantTitle && `${c.variantTitle} · `}
                  {c.sku || 'no SKU'}
                </span>
              </span>
              <span className="shrink-0 text-[13px]">{formatMoney(c.price)}</span>
              <Badge tone={variantAvailable(c.variantId) > 0 ? 'success' : 'warning'}>
                {variantAvailable(c.variantId)} avail.
              </Badge>
              <form
                className="flex shrink-0 items-center gap-1"
                onSubmit={(e) => {
                  e.preventDefault()
                  const quantity = Math.max(1, Number(qty) || 1)
                  onPick({
                    variantId: c.variantId, productId: c.productId, title: c.productTitle,
                    variantTitle: c.variantTitle, sku: c.sku, price: c.price, quantity, imageSrc: c.imageSrc,
                  })
                  onClose()
                }}
              >
                <Input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-16"
                  aria-label="Quantity"
                />
                <Button size="sm" variant="primary" type="submit">
                  Add
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
