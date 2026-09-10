import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Package, Plus, Send, Truck } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { DataTable, type Column, type FilterDef } from '@/components/data-table/DataTable'
import {
  Badge, Button, Drawer, EmptyState, Input, PageHeader, Select, Textarea, useConfirm, useToast,
} from '@/components/ui'
import { VariantPickerModal } from '@/components/VariantPickerModal'
import { formatDate, formatRelative } from '@/lib/format'
import { createTransfer, receiveTransfer, sendTransfer } from '@/services/parityService'
import { useCan } from '@/lib/permissions'
import type { InventoryTransfer } from '@/types/parity'

const statusTone = {
  draft: 'warning',
  in_transit: 'info',
  received: 'success',
} as const

const statusLabel = {
  draft: 'Draft',
  in_transit: 'In transit',
  received: 'Received',
}

export default function TransfersListPage() {
  const transfers = useStore((s) => s.transfers)
  const locations = useStore((s) => s.locations)
  const activeLocations = locations.filter((l) => l.active)
  const { toast } = useToast()
  const { confirmElement } = useConfirm()
  const [createOpen, setCreateOpen] = useState(false)
  const [detail, setDetail] = useState<InventoryTransfer | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{ fromLocationId: string; toLocationId: string; note: string } | null>(null)
  const [lines, setLines] = useState<{ variantId: string; sku: string; title: string; variantTitle: string; quantity: number }[]>([])
  const canEdit = useCan('products', 'edit')

  const locationName = (id: string) => locations.find((l) => l.id === id)?.name ?? '—'

  const filters: FilterDef<InventoryTransfer>[] = [
    {
      key: 'status', label: 'Status', type: 'multiselect',
      options: (Object.keys(statusLabel) as (keyof typeof statusLabel)[]).map((k) => ({ label: statusLabel[k], value: k })),
      predicate: (t, v) => Array.isArray(v) && v.includes(t.status),
    },
    {
      key: 'to', label: 'Destination', type: 'select',
      optionsFrom: () => locations.map((l) => ({ label: l.name, value: l.id })),
      predicate: (t, v) => t.toLocationId === v,
    },
  ]

  const columns: Column<InventoryTransfer>[] = [
    {
      key: 'name', header: 'Transfer', sortValue: (t) => t.name,
      render: (t) => <span className="font-medium">{t.name}</span>,
    },
    {
      key: 'route', header: 'From → To',
      render: (t) => (
        <span className="flex items-center gap-1.5 text-[13px] text-text-muted">
          {locationName(t.fromLocationId)} <ArrowRight size={11} /> {locationName(t.toLocationId)}
        </span>
      ),
    },
    {
      key: 'items', header: 'Items', align: 'right', sortValue: (t) => t.lines.reduce((s, l) => s + l.quantity, 0),
      render: (t) => <span>{t.lines.reduce((s, l) => s + l.quantity, 0)} units · {t.lines.length} SKU(s)</span>,
    },
    {
      key: 'status', header: 'Status', sortValue: (t) => t.status,
      render: (t) => <Badge tone={statusTone[t.status]} dot>{statusLabel[t.status]}</Badge>,
    },
    {
      key: 'created', header: 'Created', sortValue: (t) => t.createdAt,
      render: (t) => <span className="text-text-muted">{formatDate(t.createdAt)}</span>,
    },
  ]

  const openCreate = () => {
    setForm({ fromLocationId: activeLocations[0]?.id ?? '', toLocationId: activeLocations[1]?.id ?? '', note: '' })
    setLines([])
    setCreateOpen(true)
  }

  const submitCreate = async () => {
    if (!form) return
    try {
      const created = await createTransfer({ ...form, lines })
      toast('Transfer created as draft')
      setCreateOpen(false)
      setDetail(created)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to create transfer', { tone: 'critical' })
    }
  }

  const doSend = async (t: InventoryTransfer) => {
    setSaving(true)
    try {
      await sendTransfer(t.id)
      toast(`${t.name} marked in transit — source stock updated`)
      setDetail(null)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', { tone: 'critical' })
    } finally {
      setSaving(false)
    }
  }

  const doReceive = async (t: InventoryTransfer) => {
    setSaving(true)
    try {
      await receiveTransfer(t.id)
      toast(`${t.name} received — destination stock updated`)
      setDetail(null)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', { tone: 'critical' })
    } finally {
      setSaving(false)
    }
  }

  const transferTotals = useMemo(() => ({
    inTransit: transfers.filter((t) => t.status === 'in_transit').length,
    units: transfers.filter((t) => t.status === 'in_transit').reduce((s, t) => s + t.lines.reduce((q, l) => q + l.quantity, 0), 0),
  }), [transfers])

  return (
    <div>
      {confirmElement}
      <PageHeader
        title="Transfers"
        subtitle={`${transferTotals.inTransit} in transit · ${transferTotals.units} units on the way`}
        primaryAction={
          canEdit ? (
            <Button variant="primary" icon={<Plus size={13} />} onClick={openCreate}>
              Create transfer
            </Button>
          ) : undefined
        }
      />

      <DataTable
        rows={transfers}
        columns={columns}
        rowKey={(t) => t.id}
        searchKeys={(t) => [t.name, t.note ?? '']}
        searchPlaceholder="Search transfers"
        filters={filters}
        initialSort={{ key: 'created', dir: 'desc' }}
        onRowClick={(t) => setDetail(t)}
        hasAnyData={transfers.length > 0}
        emptyNoData={
          <EmptyState
            icon={Truck}
            heading="No transfers yet"
            message="Transfers move stock between your locations in two steps: send, then receive."
            primaryAction={canEdit ? { label: 'Create transfer', onClick: openCreate } : undefined}
          />
        }
      />

      {/* Create drawer */}
      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create transfer"
        subtitle="Stock leaves the source location when the transfer is sent"
        width="max-w-2xl"
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void submitCreate()} disabled={lines.length === 0}>
              Create draft transfer
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="From location"
                value={form.fromLocationId}
                onChange={(e) => setForm({ ...form, fromLocationId: e.target.value })}
                options={activeLocations.map((l) => ({ label: l.name, value: l.id }))}
              />
              <Select
                label="To location"
                value={form.toLocationId}
                onChange={(e) => setForm({ ...form, toLocationId: e.target.value })}
                options={activeLocations.map((l) => ({ label: l.name, value: l.id }))}
              />
            </div>
            <Textarea label="Note (optional)" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <div>
              <p className="mb-1.5 text-xs font-semibold">Items</p>
              {lines.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[#c9c9c9] px-3 py-4 text-center text-[13px] text-text-muted">
                  No items added yet.
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {lines.map((l, i) => (
                    <li key={l.variantId} className="flex items-center gap-2 px-3 py-2 text-[13px]">
                      <span className="min-w-0 flex-1 truncate">
                        {l.title} {l.variantTitle && `· ${l.variantTitle}`}
                        <span className="ml-1.5 text-xs text-text-muted">{l.sku}</span>
                      </span>
                      <Input
                        type="number"
                        min="1"
                        value={l.quantity}
                        onChange={(e) => setLines(lines.map((x, ix) => (ix === i ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x)))}
                        className="w-20"
                        aria-label="Quantity"
                      />
                      <Button size="sm" variant="tertiary" aria-label="Remove line" onClick={() => setLines(lines.filter((_, ix) => ix !== i))}>
                        <TrashIcon />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <Button size="sm" className="mt-2" onClick={() => setPickerOpen(true)}>
                Add item
              </Button>
            </div>
          </div>
        )}
        <VariantPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          title="Add item to transfer"
          onPick={(p) =>
            setLines((prev) => {
              const existing = prev.find((l) => l.variantId === p.variantId)
              if (existing) return prev.map((l) => (l.variantId === p.variantId ? { ...l, quantity: l.quantity + p.quantity } : l))
              return [...prev, { variantId: p.variantId, sku: p.sku, title: p.title, variantTitle: p.variantTitle, quantity: p.quantity }]
            })
          }
        />
      </Drawer>

      {/* Detail drawer */}
      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail ? `${locationName(detail.fromLocationId)} → ${locationName(detail.toLocationId)}` : undefined}
        footer={
          detail && canEdit && detail.status === 'draft' ? (
            <Button variant="primary" icon={<Send size={13} />} loading={saving} onClick={() => void doSend(detail)}>
              Send transfer
            </Button>
          ) : detail && canEdit && detail.status === 'in_transit' ? (
            <Button variant="primary" icon={<CheckCircle2 size={13} />} loading={saving} onClick={() => void doReceive(detail)}>
              Receive all items
            </Button>
          ) : undefined
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone[detail.status]} dot>{statusLabel[detail.status]}</Badge>
              <span className="text-xs text-text-muted">Created {formatRelative(detail.createdAt)}</span>
              {detail.sentAt && <span className="text-xs text-text-muted">· Sent {formatRelative(detail.sentAt)}</span>}
              {detail.receivedAt && <span className="text-xs text-text-muted">· Received {formatRelative(detail.receivedAt)}</span>}
            </div>
            {detail.note && <p className="rounded-lg bg-warning-surface-soft p-2.5 text-[13px] text-warning">{detail.note}</p>}
            <ul className="divide-y divide-border rounded-lg border border-border text-[13px]">
              {detail.lines.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate">
                    {l.title} {l.variantTitle && `· ${l.variantTitle}`}
                    <span className="block text-xs text-text-muted">{l.sku}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-medium">{l.quantity}</span>
                    <span className="block text-xs text-text-muted">
                      {l.receivedQuantity > 0 ? `${l.receivedQuantity} received` : 'not received'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="flex items-start gap-2 text-xs text-text-muted">
              <Package size={12} className="mt-0.5 shrink-0" />
              Sending deducts units from the source location; receiving adds them at the destination. Both steps are
              recorded in inventory history.
            </p>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  )
}
