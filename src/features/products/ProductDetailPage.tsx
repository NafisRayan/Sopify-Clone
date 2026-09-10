import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Archive, MoreVertical, Package, PenLine, Trash2, TriangleAlert } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Badge, Button, Card, CardHeader, CardSection, DividedCard, EmptyState, PortalMenu, useConfirm, useToast, type MenuItemDef } from '@/components/ui'
import { PageHeader } from '@/components/ui/Feedback'
import { formatDate, formatMoney, formatWeight } from '@/lib/format'
import { STATUS_LABELS } from '@/lib/constants'
import { variantAvailable } from '@/store/selectors'
import { deleteProducts, duplicateProduct } from '@/services/productsService'
import { useCan } from '@/lib/permissions'
import { ProductMetafieldsCard } from './ProductMetafieldsCard'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const product = useStore((s) => s.products.find((p) => p.id === id))
  const collections = useStore((s) => s.collections)
  const locations = useStore((s) => s.locations)
  const inventoryLevels = useStore((s) => s.inventoryLevels)
  const orders = useStore((s) => s.orders)
  const [tab, setTab] = useState<'overview' | 'inventory'>('overview')
  const canRemove = useCan('products', 'delete')
  const canEdit = useCan('products', 'edit')

  const ordersWithProduct = useMemo(() => {
    if (!product) return []
    return orders
      .filter((o) => !o.isDraft && o.lineItems.some((li) => li.productId === product.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8)
  }, [orders, product])

  if (!product) {
    return (
      <div>
        <PageHeader title="Product not found" backTo="/products" backLabel="Products" />
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState heading="Product not found" message="It may have been deleted." primaryAction={{ label: 'Back to products', onClick: () => navigate('/products') }} />
        </div>
      </div>
    )
  }

  const totalAvailable = product.variants.reduce((s, v) => s + variantAvailable(v.id), 0)
  const productCollections = collections.filter((c) => product.collectionIds.includes(c.id))
  const price = product.variants[0]?.price ?? 0
  const cost = product.variants[0]?.costPerItem
  const margin = cost !== undefined && price > 0 ? ((price - cost) / price) * 100 : undefined

  return (
    <div>
      {confirmElement}
      <PageHeader
        title={product.title || 'Untitled'}
        subtitle={
          <span className="flex items-center gap-2">
            <Badge tone={product.status === 'active' ? 'success' : product.status === 'draft' ? 'info' : 'neutral'} dot>
              {STATUS_LABELS[product.status]}
            </Badge>
            <span>· {product.vendor}</span>
            <span>· created {formatDate(product.createdAt)}</span>
          </span>
        }
        backTo="/products"
        backLabel="Products"
        primaryAction={
          canEdit ? (
            <Button variant="primary" icon={<PenLine size={13} />} onClick={() => navigate(`/products/${product.id}/edit`)}>
              Edit
            </Button>
          ) : undefined
        }
        secondaryActions={
          <PortalMenu
            align="right"
            trigger={
              <button aria-label="More actions" className="rounded-lg border border-[#d0d0d0] p-2 hover:bg-surface-hover">
                <MoreVertical size={15} />
              </button>
            }
            items={[
              { label: 'Duplicate', onClick: () => void duplicateProduct(product.id).then(() => toast('Product duplicated')), disabled: !canEdit },
              ...(product.status !== 'archived' && canEdit
                ? [{ label: 'Archive', icon: <Archive size={13} />, onClick: () => navigate(`/products/${product.id}/edit`) } satisfies MenuItemDef]
                : []),
              {
                label: 'Delete', icon: <Trash2 size={13} />, destructive: true, separatorBefore: true, disabled: !canRemove,
                onClick: () =>
                  confirm({
                    title: `Delete ${product.title}?`,
                    body: 'The product will be removed from all collections. This action cannot be undone.',
                    confirmLabel: 'Delete',
                    destructive: true,
                    onConfirm: async () => {
                      await deleteProducts([product.id])
                      toast('Product deleted', { tone: 'critical' })
                      navigate('/products')
                    },
                  }),
              },
            ]}
          />
        }
      />

      <div className="mb-4 flex gap-1" role="tablist">
        {(['overview', 'inventory'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`h-8 rounded-lg px-3 text-[13px] font-medium capitalize ${tab === t ? 'bg-[#e3e3e3] text-text' : 'text-text-muted hover:bg-surface-hover'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {tab === 'overview' ? (
            <>
              <DividedCard>
                <CardHeader title="Media" />
                <div className="flex flex-wrap gap-3 px-4 py-4 md:px-5">
                  {product.media.map((m, i) => (
                    <div key={m.id} className="relative">
                      <img src={m.src} alt={m.alt} className="h-24 w-24 rounded-lg border border-border object-cover" />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">Featured</span>
                      )}
                    </div>
                  ))}
                  {product.media.length === 0 && <p className="text-[13px] text-text-muted">No media.</p>}
                </div>
              </DividedCard>

              <DividedCard>
                <CardHeader title="Description" />
                <div
                  className="prose-product px-4 py-4 md:px-5"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml || '<p>No description.</p>' }}
                />
              </DividedCard>

              <DividedCard>
                <CardHeader title="Pricing" />
                <CardSection>
                  <dl className="grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-4">
                    <div>
                      <dt className="text-xs text-text-muted">Price</dt>
                      <dd className="mt-0.5 font-medium">{formatMoney(price)}</dd>
                    </div>
                    {product.variants[0]?.compareAtPrice && (
                      <div>
                        <dt className="text-xs text-text-muted">Compare-at</dt>
                        <dd className="mt-0.5 line-through">{formatMoney(product.variants[0].compareAtPrice!)}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs text-text-muted">Cost per item</dt>
                      <dd className="mt-0.5">{cost !== undefined ? formatMoney(cost) : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-text-muted">Margin</dt>
                      <dd className="mt-0.5">{margin !== undefined ? `${margin.toFixed(1)}%` : '—'}</dd>
                    </div>
                  </dl>
                </CardSection>
              </DividedCard>

              <DividedCard>
                <CardHeader title={`Variants (${product.variants.length})`} />
                <div className="overflow-x-auto scroll-thin">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-[#fafafa] text-left text-xs text-text-muted">
                        <th className="px-4 py-2 font-medium">Variant</th>
                        <th className="px-4 py-2 font-medium">SKU</th>
                        <th className="px-4 py-2 font-medium">Price</th>
                        <th className="px-4 py-2 font-medium">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {product.variants.map((v) => (
                        <tr key={v.id}>
                          <td className="px-4 py-2">{v.title}</td>
                          <td className="px-4 py-2 text-text-muted">{v.sku || '—'}</td>
                          <td className="px-4 py-2">{formatMoney(v.price)}</td>
                          <td className="px-4 py-2">
                            {!product.trackQuantity ? (
                              <Badge tone="info">Not tracked</Badge>
                            ) : variantAvailable(v.id) === 0 ? (
                              <Badge tone="critical">Out of stock</Badge>
                            ) : variantAvailable(v.id) <= 10 ? (
                              <Badge tone="warning">{variantAvailable(v.id)}</Badge>
                            ) : (
                              variantAvailable(v.id)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DividedCard>

              <DividedCard>
                <CardHeader title="Search engine listing" subtitle="Preview" />
                <CardSection>
                  <p className="text-xs text-text-subdued">northstargoods.com/products/{product.seo.handle}</p>
                  <p className="mt-1 text-[15px] font-medium text-[#1a0dab]">{product.seo.title || product.title}</p>
                  <p className="text-[13px] text-text-muted">{product.seo.description || 'No description set.'}</p>
                </CardSection>
              </DividedCard>
            </>
          ) : (
            <DividedCard>
              <CardHeader title="Inventory by location" subtitle={`Totals across ${locations.filter((l) => l.active).length} active locations`} />
              <div className="overflow-x-auto scroll-thin">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-[#fafafa] text-left text-xs text-text-muted">
                      <th className="px-4 py-2 font-medium">Variant</th>
                      {locations.filter((l) => l.active).map((l) => (
                        <th key={l.id} className="px-3 py-2 font-medium">{l.name}</th>
                      ))}
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {product.variants.map((v) => {
                      const levels = locations.filter((l) => l.active).map((l) =>
                        inventoryLevels.find((x) => x.variantId === v.id && x.locationId === l.id),
                      )
                      return (
                        <tr key={v.id}>
                          <td className="px-4 py-2">{v.title}</td>
                          {levels.map((lv, i) => (
                            <td key={i} className="px-3 py-2">{lv ? lv.available : '—'}</td>
                          ))}
                          <td className="px-3 py-2 text-right font-medium">{variantAvailable(v.id)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <CardSection className="text-xs text-text-muted">
                Adjust stock from the{' '}
                <Link to={`/inventory?q=${encodeURIComponent(product.variants[0]?.sku ?? '')}`} className="text-accent hover:underline">
                  inventory page
                </Link>
                .
              </CardSection>
            </DividedCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <dl className="space-y-3 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Status</dt>
                <dd><Badge tone={product.status === 'active' ? 'success' : product.status === 'draft' ? 'info' : 'neutral'} dot>{STATUS_LABELS[product.status]}</Badge></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Channels</dt>
                <dd className="flex gap-1">
                  {product.channels.map((c) => (
                    <Badge key={c} tone="info">{c === 'online_store' ? 'Online Store' : 'Point of Sale'}</Badge>
                  ))}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Product type</dt>
                <dd>{product.productType || '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Category</dt>
                <dd className="max-w-[60%] truncate text-right" title={product.category}>{product.category || '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Weight</dt>
                <dd>{formatWeight(product.weightGrams)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Requires shipping</dt>
                <dd>{product.requiresShipping ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h3 className="mb-2 text-[13px] font-semibold">Collections</h3>
            {productCollections.length === 0 ? (
              <p className="text-[13px] text-text-muted">Not in any collection.</p>
            ) : (
              <ul className="space-y-1.5">
                {productCollections.map((c) => (
                  <li key={c.id}>
                    <Link to={`/collections/${c.id}`} className="flex items-center gap-2 text-[13px] text-accent hover:underline">
                      <Package size={13} />
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h3 className="mb-2 text-[13px] font-semibold">Tags</h3>
            {product.tags.length === 0 ? (
              <p className="text-[13px] text-text-muted">No tags.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            )}
          </Card>

          <ProductMetafieldsCard productId={product.id} />

          <Card padding={false}>
            <CardHeader title="Who ordered this" subtitle={`${ordersWithProduct.length} recent order${ordersWithProduct.length === 1 ? '' : 's'}`} />
            {ordersWithProduct.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px] text-text-muted">No orders include this product yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {ordersWithProduct.map((o) => (
                  <li key={o.id}>
                    <Link to={`/orders/${o.id}`} className="flex items-center justify-between px-4 py-2 text-[13px] hover:bg-surface-hover">
                      <span className="font-medium">{o.name}</span>
                      <span className="text-text-muted">{formatDate(o.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {totalAvailable <= 10 && product.trackQuantity && (
            <Card className="border-[#ecd489] bg-warning-surface-soft">
              <div className="flex items-start gap-2 text-[13px] text-warning">
                <TriangleAlert size={15} className="mt-0.5 shrink-0" />
                <p>
                  {totalAvailable === 0
                    ? 'All variants are out of stock — restock soon to keep selling.'
                    : `Only ${totalAvailable} units left across all variants.`}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
