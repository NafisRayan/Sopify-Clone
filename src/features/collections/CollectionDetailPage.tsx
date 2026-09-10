import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Search, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { smartPreview } from '@/services/collectionsService'
import {
  Badge, Button, Card, CardHeader, CardSection, DividedCard, EmptyState, Input, Modal,
  PageHeader, Select, Textarea, Toggle, useConfirm, useToast,
} from '@/components/ui'
import { formatMoney } from '@/lib/format'
import { STATUS_LABELS } from '@/lib/constants'
import { addProducts, deleteCollections, removeProducts, updateCollection } from '@/services/collectionsService'
import { slugify } from '@/lib/validation'
import { useCan } from '@/lib/permissions'
import type { Collection, CollectionRuleColumn, CollectionRuleRelation, Product } from '@/types'

const RULE_COLUMNS: { value: CollectionRuleColumn; label: string }[] = [
  { value: 'tag', label: 'Product tag' },
  { value: 'title', label: 'Product title' },
  { value: 'product_type', label: 'Product type' },
  { value: 'vendor', label: 'Product vendor' },
]
const RULE_RELATIONS: { value: CollectionRuleRelation; label: string }[] = [
  { value: 'equals', label: 'is equal to' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
]

/** Searchable product picker used for manual collections */
function ProductPicker({
  open,
  onClose,
  onAdd,
  existingIds,
}: {
  open: boolean
  onClose: () => void
  onAdd: (products: Product[]) => void
  existingIds: string[]
}) {
  const products = useStore((s) => s.products)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((p) => p.status !== 'archived' && !existingIds.includes(p.id))
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q)))
      .slice(0, 30)
  }, [products, query, existingIds])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add products"
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={selected.size === 0}
            onClick={() => {
              onAdd(candidates.filter((p) => selected.has(p.id)))
              setSelected(new Set())
              onClose()
            }}
          >
            Add {selected.size > 0 ? `${selected.size} ` : ''}product{selected.size === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="h-8 w-full rounded-lg border border-[#c9c9c9] pl-8 pr-3 text-[13px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <ul className="max-h-72 divide-y divide-border overflow-y-auto rounded-lg border border-border scroll-thin">
          {candidates.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-text-muted">No products match.</li>}
          {candidates.map((p) => (
            <li key={p.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-surface-hover">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#303030]"
                  checked={selected.has(p.id)}
                  onChange={(e) => {
                    const next = new Set(selected)
                    if (e.target.checked) next.add(p.id)
                    else next.delete(p.id)
                    setSelected(next)
                  }}
                />
                {p.media[0] && <img src={p.media[0].src} alt="" className="h-8 w-8 rounded-md border border-border object-cover" />}
                <span className="min-w-0 flex-1 truncate text-[13px]">{p.title}</span>
                <span className="text-xs text-text-muted">{formatMoney(p.variants[0]?.price ?? 0)}</span>
                <Badge tone={STATUS_LABELS[p.status] === 'Active' ? 'success' : 'neutral'}>{STATUS_LABELS[p.status]}</Badge>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}

export default function CollectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const collection = useStore((s) => s.collections.find((c) => c.id === id))
  const allProducts = useStore((s) => s.products)
  const [draft, setDraft] = useState<Collection | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const canEdit = useCan('products', 'edit')

  useEffect(() => {
    setDraft(collection ? structuredClone(collection) : null)
  }, [collection])

  const previewProducts = useMemo(() => {
    if (!draft) return []
    if (draft.type === 'smart') return smartPreview(draft.rules, draft.rulesMatch)
    return draft.productIds.map((pid) => allProducts.find((p) => p.id === pid)).filter(Boolean) as Product[]
  }, [draft, allProducts])

  if (!collection && !draft) {
    return (
      <div>
        <PageHeader title="Collection not found" backTo="/collections" backLabel="Collections" />
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState heading="Collection not found" message="It may have been deleted." primaryAction={{ label: 'Back to collections', onClick: () => navigate('/collections') }} />
        </div>
      </div>
    )
  }
  if (!draft) return null

  const patch = (p: Partial<Collection>) => setDraft((prev) => (prev ? { ...prev, ...p } : prev))

  const save = async () => {
    if (!draft.title.trim()) {
      toast('Title is required', { tone: 'critical' })
      return
    }
    setSaving(true)
    try {
      await updateCollection(draft.id, {
        ...draft,
        title: draft.title.trim(),
        seoTitle: draft.seoTitle ?? draft.title,
      })
      toast('Collection saved')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', { tone: 'critical' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {confirmElement}
      <PageHeader
        title={draft.title || 'Untitled collection'}
        subtitle={draft.type === 'smart' ? 'Automated collection — products match the rules below' : 'Manual collection'}
        backTo="/collections"
        backLabel="Collections"
        primaryAction={
          <span className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="primary"
                loading={saving}
                onClick={() => void save()}
              >
                Save
              </Button>
            )}
          </span>
        }
        secondaryActions={
          canEdit ? (
            <Button
              variant="destructive"
              icon={<Trash2 size={13} />}
              onClick={() =>
                confirm({
                  title: `Delete ${draft.title}?`,
                  body: `${previewProducts.length} products will be removed from this collection. The products are not deleted.`,
                  confirmLabel: 'Delete',
                  destructive: true,
                  onConfirm: async () => {
                    await deleteCollections([draft.id])
                    toast('Collection deleted', { tone: 'critical' })
                    navigate('/collections')
                  },
                })
              }
            >
              Delete
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card padding={false}>
            <CardHeader title="Collection details" />
            <CardSection>
              <div className="space-y-3">
                <Input label="Title" value={draft.title} onChange={(e) => patch({ title: e.target.value })} disabled={!canEdit} />
                <Textarea
                  label="Description"
                  value={draft.descriptionHtml.replace(/<[^>]+>/g, '')}
                  onChange={(e) => patch({ descriptionHtml: `<p>${e.target.value}</p>` })}
                  rows={3}
                  disabled={!canEdit}
                />
                {draft.type === 'smart' && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-text">Conditions</p>
                    <div className="space-y-2">
                      {draft.rules.map((rule, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                          <Select
                            value={rule.column}
                            onChange={(e) =>
                              patch({ rules: draft.rules.map((r, ix) => (ix === i ? { ...r, column: e.target.value as CollectionRuleColumn } : r)) })
                            }
                            options={RULE_COLUMNS}
                            className="max-w-[150px]"
                            aria-label="Condition column"
                          />
                          <Select
                            value={rule.relation}
                            onChange={(e) =>
                              patch({ rules: draft.rules.map((r, ix) => (ix === i ? { ...r, relation: e.target.value as CollectionRuleRelation } : r)) })
                            }
                            options={RULE_RELATIONS}
                            className="max-w-[150px]"
                            aria-label="Condition relation"
                          />
                          <Input
                            value={rule.condition}
                            onChange={(e) => patch({ rules: draft.rules.map((r, ix) => (ix === i ? { ...r, condition: e.target.value } : r)) })}
                            placeholder="condition"
                            className="max-w-[180px]"
                            aria-label="Condition value"
                          />
                          <Button
                            size="sm"
                            variant="tertiary"
                            icon={<Trash2 size={12} />}
                            aria-label="Remove condition"
                            onClick={() => patch({ rules: draft.rules.filter((_, ix) => ix !== i) })}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          icon={<Plus size={12} />}
                          onClick={() => patch({ rules: [...draft.rules, { column: 'tag', relation: 'equals', condition: '' }] })}
                          disabled={!canEdit}
                        >
                          Add condition
                        </Button>
                        {draft.rules.length > 1 && (
                          <Select
                            value={draft.rulesMatch}
                            onChange={(e) => patch({ rulesMatch: e.target.value as 'all' | 'any' })}
                            options={[
                              { label: 'Match ALL conditions', value: 'all' },
                              { label: 'Match ANY condition', value: 'any' },
                            ]}
                            className="max-w-[220px]"
                            aria-label="Rule matching"
                          />
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      Products matching the conditions are added automatically when you save.
                    </p>
                  </div>
                )}
              </div>
            </CardSection>
          </Card>

          {/* Products in collection */}
          <DividedCard>
            <CardHeader
              title={`Products (${previewProducts.length})`}
              subtitle={draft.type === 'smart' ? 'Live preview of rule matches' : undefined}
              actions={
                canEdit &&
                draft.type === 'manual' && (
                  <Button size="sm" icon={<Plus size={12} />} onClick={() => setPickerOpen(true)}>
                    Add products
                  </Button>
                )
              }
            />
            {previewProducts.length === 0 ? (
              <EmptyState
                compact
                heading="No products in this collection"
                message={draft.type === 'smart' ? 'No products match the current conditions. Loosen the rules or save to refresh.' : 'Add products to curate this collection.'}
                primaryAction={canEdit && draft.type === 'manual' ? { label: 'Add products', onClick: () => setPickerOpen(true) } : undefined}
              />
            ) : (
              <ul className="divide-y divide-border">
                {previewProducts.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                    {p.media[0] && <img src={p.media[0].src} alt="" className="h-8 w-8 rounded-md border border-border object-cover" />}
                    <Link to={`/products/${p.id}`} className="min-w-0 flex-1 truncate text-[13px] font-medium hover:text-accent hover:underline">
                      {p.title}
                    </Link>
                    <span className="text-xs text-text-muted">{formatMoney(p.variants[0]?.price ?? 0)}</span>
                    <Badge tone={p.status === 'active' ? 'success' : p.status === 'draft' ? 'info' : 'neutral'} dot>
                      {STATUS_LABELS[p.status]}
                    </Badge>
                    {canEdit && draft.type === 'manual' && (
                      <button
                        aria-label={`Remove ${p.title}`}
                        className="rounded p-1 text-text-muted hover:bg-critical-surface hover:text-critical-strong"
                        onClick={() =>
                          void removeProducts(draft.id, [p.id]).then(() => {
                            toast('Product removed')
                            setDraft({ ...draft, productIds: draft.productIds.filter((pid) => pid !== p.id) })
                          })
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </DividedCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card padding={false}>
            <CardHeader title="Visibility" />
            <CardSection>
              <div className="space-y-3">
                <Select
                  label="Status"
                  value={draft.status}
                  onChange={(e) => patch({ status: e.target.value as Collection['status'] })}
                  options={[
                    { label: 'Active — visible on the storefront', value: 'active' },
                    { label: 'Draft — hidden', value: 'draft' },
                  ]}
                  disabled={!canEdit}
                />
                <Toggle
                  label="Include in storefront navigation"
                  helpText="Collections menus link to /collections/{handle}"
                  checked={draft.status === 'active'}
                  onChange={(on) => patch({ status: on ? 'active' : 'draft' })}
                  disabled={!canEdit}
                />
              </div>
            </CardSection>
          </Card>

          <Card padding={false}>
            <CardHeader title="Search engine listing" />
            <CardSection>
              <div className="space-y-3">
                <Input label="SEO title" value={draft.seoTitle ?? ''} onChange={(e) => patch({ seoTitle: e.target.value })} disabled={!canEdit} />
                <Textarea label="SEO description" rows={2} value={draft.seoDescription ?? ''} onChange={(e) => patch({ seoDescription: e.target.value })} disabled={!canEdit} />
                <Input
                  label="Handle"
                  value={draft.handle}
                  onChange={(e) => patch({ handle: slugify(e.target.value) })}
                  helpText={`northstargoods.com/collections/${draft.handle}`}
                  disabled={!canEdit}
                />
              </div>
            </CardSection>
          </Card>
        </div>
      </div>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        existingIds={draft.productIds}
        onAdd={(products) => {
          void addProducts(draft.id, products.map((p) => p.id)).then(() => {
            toast(`${products.length} product${products.length === 1 ? '' : 's'} added`)
            setDraft({ ...draft, productIds: [...new Set([...draft.productIds, ...products.map((p) => p.id)])] })
          })
        }}
      />
    </div>
  )
}
