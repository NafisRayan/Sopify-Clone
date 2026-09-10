import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Plus, Trash2, Users } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { DataTable, type Column } from '@/components/data-table/DataTable'
import { Button, EmptyState, Input, Modal, Select, useConfirm, useToast } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { createSegment, segmentMembers } from '@/services/parityService'
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

export default function SegmentsListPage() {
  const segments = useStore((s) => s.segments)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirmElement } = useConfirm()
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '',
    filters: [{ column: 'total_spent' as SegmentColumn, relation: 'gt' as SegmentRelation, value: '' }],
  })
  const canEdit = useCan('customers', 'edit')

  const memberCounts = useMemo(
    () => Object.fromEntries(segments.map((s) => [s.id, segmentMembers(s).length])),
    [segments],
  )

  const columns: Column<CustomerSegment>[] = [
    {
      key: 'name', header: 'Segment', sortValue: (s) => s.name.toLowerCase(),
      render: (s) => (
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-surface text-accent">
            <Users size={14} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{s.name}</span>
            <span className="block truncate text-xs text-text-muted">{s.description ?? `${s.filters.length} filter(s)`}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'members', header: 'Members', align: 'right', sortValue: (s) => memberCounts[s.id] ?? 0,
      render: (s) => <span className="font-medium">{memberCounts[s.id] ?? 0}</span>,
    },
    {
      key: 'created', header: 'Created', sortValue: (s) => s.createdAt,
      render: (s) => <span className="text-text-muted">{formatDate(s.createdAt)}</span>,
    },
  ]

  return (
    <div>
      {confirmElement}
      {/* Create drawer */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create segment"
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!form.name.trim()) {
                  toast('Give the segment a name', { tone: 'critical' })
                  return
                }
                const filters = form.filters.filter((f) => f.value.trim() !== '')
                try {
                  const created = await createSegment({ name: form.name, description: form.description || undefined, filters })
                  toast('Segment created')
                  setCreateOpen(false)
                  navigate(`/customers/segments/${created.id}`)
                } catch (e) {
                  toast(e instanceof Error ? e.message : 'Failed to create segment', { tone: 'critical' })
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. High spenders" />
          <Input label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <p className="mb-1.5 text-xs font-semibold">Filters — customers must match all</p>
            <div className="space-y-2">
              {form.filters.map((f, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <Select
                    value={f.column}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        filters: form.filters.map((x, ix) => (ix === i ? { ...x, column: e.target.value as SegmentColumn } : x)),
                      })
                    }
                    options={COLUMN_OPTIONS}
                    className="max-w-[170px]"
                    aria-label="Filter column"
                  />
                  <Select
                    value={f.relation}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        filters: form.filters.map((x, ix) => (ix === i ? { ...x, relation: e.target.value as SegmentRelation } : x)),
                      })
                    }
                    options={RELATION_OPTIONS}
                    className="max-w-[150px]"
                    aria-label="Filter relation"
                  />
                  <Input
                    value={f.value}
                    onChange={(e) => setForm({ ...form, filters: form.filters.map((x, ix) => (ix === i ? { ...x, value: e.target.value } : x)) })}
                    placeholder="value"
                    className="max-w-[140px]"
                    aria-label="Filter value"
                  />
                  {form.filters.length > 1 && (
                    <Button size="sm" variant="tertiary" icon={<Trash2 size={12} />} aria-label="Remove filter" onClick={() => setForm({ ...form, filters: form.filters.filter((_, ix) => ix !== i) })}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                size="sm"
                icon={<Plus size={12} />}
                onClick={() => setForm({ ...form, filters: [...form.filters, { column: 'tag', relation: 'equals', value: '' }] })}
              >
                Add filter
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <DataTable
        rows={segments}
        columns={columns}
        rowKey={(s) => s.id}
        searchKeys={(s) => [s.name, s.description ?? '']}
        searchPlaceholder="Search segments"
        hasAnyData={segments.length > 0}
        initialSort={{ key: 'name', dir: 'asc' }}
        onRowClick={(s) => navigate(`/customers/segments/${s.id}`)}
        toolbarExtra={
          <Button size="sm" variant="primary" icon={<Plus size={13} />} onClick={() => setCreateOpen(true)} disabled={!canEdit}>
            Create segment
          </Button>
        }
        emptyNoData={
          <EmptyState
            icon={PieChart}
            heading="No segments yet"
            message="Segments are saved customer filters that update automatically."
            primaryAction={canEdit ? { label: 'Create segment', onClick: () => setCreateOpen(true) } : undefined}
          />
        }
      />
      {segments.length > 0 && (
        <p className="mt-2 text-xs text-text-muted">
          Open a segment to preview its members — membership recalculates live from customer data.
        </p>
      )}
    </div>
  )
}
