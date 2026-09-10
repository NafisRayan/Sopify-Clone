import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Download, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Badge, Button, Card, CardHeader, EmptyState, Input, PageHeader, Select, useConfirm, useToast } from '@/components/ui'
import { formatMoney, initials } from '@/lib/format'
import { downloadCsv } from '@/lib/csv'
import { customerStats } from '@/store/selectors'
import { deleteSegment, segmentMembers, updateSegment } from '@/services/parityService'
import { useCan } from '@/lib/permissions'
import type { CustomerSegment, SegmentColumn, SegmentRelation } from '@/types/parity'

const COLUMN_OPTIONS: { value: SegmentColumn; label: string }[] = [
  { value: 'orders_count', label: 'Number of orders' },
  { value: 'total_spent', label: 'Amount spent ($)' },
  { value: 'tag', label: 'Customer tag' },
  { value: 'email_state', label: 'Email consent' },
  { value: 'city', label: 'City' },
  { value: 'country', label: 'Country' },
]
const RELATION_OPTIONS: { value: SegmentRelation; label: string }[] = [
  { value: 'gt', label: 'is greater than' },
  { value: 'lt', label: 'is less than' },
  { value: 'equals', label: 'equals' },
  { value: 'contains', label: 'contains' },
]

export default function SegmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const segment = useStore((s) => s.segments.find((x) => x.id === id))
  const members = useMemo(() => (segment ? segmentMembers(segment) : []), [segment])
  const [saving, setSaving] = useState(false)
  const [filterDraft, setFilterDraft] = useState<CustomerSegment['filters'] | null>(null)
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const canEdit = useCan('customers', 'edit')

  if (!segment) {
    return (
      <div>
        <PageHeader title="Segment not found" backTo="/customers/segments" backLabel="Segments" />
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState heading="Segment not found" primaryAction={{ label: 'Back to segments', onClick: () => navigate('/customers/segments') }} />
        </div>
      </div>
    )
  }

  const activeFilters = filterDraft ?? segment.filters
  const saveFilters = async (next: CustomerSegment['filters']) => {
    setSaving(true)
    try {
      await updateSegment(segment.id, { filters: next })
      setFilterDraft(null)
      toast(`Segment updated — ${segmentMembers({ ...segment, filters: next }).length} members`)
    } finally {
      setSaving(false)
    }
  }

  const exportCsv = () => {
    downloadCsv(
      `segment-${segment.name.toLowerCase().replace(/\s+/g, '-')}`,
      members,
      [
        { header: 'Name', value: (c) => `${c.firstName} ${c.lastName}` },
        { header: 'Email', value: (c) => c.email },
        { header: 'Orders', value: (c) => customerStats(c.id).ordersCount },
        { header: 'Total spent', value: (c) => customerStats(c.id).totalSpent.toFixed(2) },
        { header: 'City', value: (c) => c.defaultAddress?.city ?? '' },
        { header: 'Country', value: (c) => c.defaultAddress?.country ?? '' },
      ],
    )
    toast(`Exported ${members.length} members to CSV`)
  }

  return (
    <div>
      {confirmElement}
      <PageHeader
        title={segment.name}
        subtitle={segment.description ?? 'Saved customer segment — membership updates automatically'}
        backTo="/customers/segments"
        backLabel="Segments"
        primaryAction={
          <Button icon={<Download size={13} />} onClick={exportCsv} disabled={members.length === 0}>
            Export members
          </Button>
        }
        secondaryActions={
          canEdit ? (
            <Button
              variant="destructive"
              onClick={() =>
                confirm({
                  title: `Delete ${segment.name}?`,
                  body: 'Customers remain untouched; only the saved segment is removed.',
                  confirmLabel: 'Delete segment',
                  destructive: true,
                  onConfirm: async () => {
                    await deleteSegment(segment.id)
                    toast('Segment deleted', { tone: 'critical' })
                    navigate('/customers/segments')
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
        <div className="lg:col-span-2">
          <Card padding={false}>
            <CardHeader title={`Members (${members.length})`} subtitle="Live preview" />
            {members.length === 0 ? (
              <EmptyState compact icon={Trash2} heading="No customers match" message="Loosen the filters to grow this segment." />
            ) : (
              <ul className="divide-y divide-border">
                {members.map((c) => {
                  const stats = customerStats(c.id)
                  return (
                    <li key={c.id}>
                      <button
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-hover"
                        onClick={() => navigate(`/customers/${c.id}`)}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e3e3e3] text-[11px] font-semibold">
                          {initials(`${c.firstName} ${c.lastName}`)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">{c.firstName} {c.lastName}</span>
                          <span className="block truncate text-xs text-text-muted">{c.email}</span>
                        </span>
                        <span className="text-xs text-text-muted">{stats.ordersCount} orders</span>
                        <span className="w-20 text-right text-[13px] font-medium">{formatMoney(stats.totalSpent)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card padding={false}>
            <CardHeader title="Segment name" />
            <div className="px-4 py-3">
              {nameDraft !== null ? (
                <div className="flex items-end gap-2">
                  <Input label="Name" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => void updateSegment(segment.id, { name: nameDraft }).then(() => { toast('Segment renamed'); setNameDraft(null) })}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <button
                  className={`text-left text-[13px] ${canEdit ? 'text-accent hover:underline' : 'text-text'}`}
                  onClick={() => canEdit && setNameDraft(segment.name)}
                >
                  {segment.name}
                </button>
              )}
            </div>
          </Card>

          <Card padding={false}>
            <CardHeader title="Filters" subtitle="Customers must match all" />
            <div className="space-y-2 px-4 py-3">
              {activeFilters.map((f, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <Select
                    value={f.column}
                    onChange={(e) => setFilterDraft(activeFilters.map((x, ix) => (ix === i ? { ...x, column: e.target.value as SegmentColumn } : x)))}
                    options={COLUMN_OPTIONS}
                    className="max-w-[160px]"
                    aria-label="Filter column"
                    disabled={!canEdit}
                  />
                  <Select
                    value={f.relation}
                    onChange={(e) => setFilterDraft(activeFilters.map((x, ix) => (ix === i ? { ...x, relation: e.target.value as SegmentRelation } : x)))}
                    options={RELATION_OPTIONS}
                    className="max-w-[140px]"
                    aria-label="Filter relation"
                    disabled={!canEdit}
                  />
                  <Input
                    value={f.value}
                    onChange={(e) => setFilterDraft(activeFilters.map((x, ix) => (ix === i ? { ...x, value: e.target.value } : x)))}
                    className="max-w-[130px]"
                    aria-label="Filter value"
                    disabled={!canEdit}
                  />
                  {canEdit && activeFilters.length > 1 && (
                    <Button size="sm" variant="tertiary" aria-label="Remove filter" onClick={() => setFilterDraft(activeFilters.filter((_, ix) => ix !== i))}>
                      <Trash2 size={12} />
                    </Button>
                  )}
                </div>
              ))}
              {canEdit && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    icon={<Plus size={12} />}
                    onClick={() => setFilterDraft([...activeFilters, { column: 'tag', relation: 'equals', value: '' }])}
                  >
                    Add filter
                  </Button>
                  {filterDraft && (
                    <>
                      <Button size="sm" variant="primary" loading={saving} onClick={() => void saveFilters(filterDraft.filter((f) => f.value.trim() !== ''))}>
                        Apply
                      </Button>
                      <Button size="sm" onClick={() => setFilterDraft(null)}>Discard</Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-[13px] font-semibold">About segments</h3>
            <p className="mt-1.5 text-xs text-text-muted">
              Segments are saved filters evaluated against live customer data — new customers join automatically
              when they match, mirroring Shopify's customer segments.
            </p>
            <div className="mt-2 flex gap-1.5">
              {segment.filters.map((f, i) => (
                <Badge key={i}>{f.column}</Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
