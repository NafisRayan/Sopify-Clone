import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, History, MoreVertical, Package, TriangleAlert } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { onHand } from '@/store/selectors'
import { DataTable, type Column, type FilterDef } from '@/components/data-table/DataTable'
import {
  Badge, Button, Card, Drawer, EmptyState, Input, PageHeader, PortalMenu, Select, Textarea,
  useConfirm, useToast,
} from '@/components/ui'
import { formatRelative } from '@/lib/format'
import { adjustInventory, historyFor, transferInventory } from '@/services/inventoryService'
import { useCan } from '@/lib/permissions'
import type { InventoryHistoryEntry, Product } from '@/types'

interface InventoryRow {
  variantId: string
  productId: string
  productTitle: string
  variantTitle: string
  sku: string
  imageSrc?: string
  locationId: string
  locationName: string
  available: number
  committed: number
  unavailable: number
  onHand: number
}

function useInventoryRows(): InventoryRow[] {
  const products = useStore((s) => s.products)
  const locations = useStore((s) => s.locations)
  const levels = useStore((s) => s.inventoryLevels)
  return useMemo(() => {
    const rows: InventoryRow[] = []
    for (const p of products) {
      if (p.status === 'archived' || !p.trackQuantity) continue
      for (const v of p.variants) {
        for (const l of locations.filter((x) => x.active)) {
          const level = levels.find((x) => x.variantId === v.id && x.locationId === l.id)
          if (!level) continue
          rows.push({
            variantId: v.id,
            productId: p.id,
            productTitle: p.title,
            variantTitle: v.title === 'Default Title' ? '' : v.title,
            sku: v.sku,
            imageSrc: p.media[0]?.src,
            locationId: l.id,
            locationName: l.name,
            available: level.available,
            committed: level.committed,
            unavailable: level.unavailable,
            onHand: onHand(level),
          })
        }
      }
    }
    return rows
  }, [products, locations, levels])
}

export default function InventoryPage() {
  const locations = useStore((s) => s.locations.filter((l) => l.active))
  const [locationId, setLocationId] = useState<string>(locations[0]?.id ?? '')
  const rows = useInventoryRows()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const canEdit = useCan('products', 'edit')

  const [adjustRow, setAdjustRow] = useState<InventoryRow | null>(null)
  const [transferRow, setTransferRow] = useState<InventoryRow | null>(null)
  const [historyRow, setHistoryRow] = useState<{ sku: string; title: string } | null>(null)
  const [history, setHistory] = useState<InventoryHistoryEntry[]>([])
  const [bulkRows, setBulkRows] = useState<InventoryRow[] | null>(null)

  // adjust form
  const [adjustQty, setAdjustQty] = useState('0')
  const [adjustReason, setAdjustReason] = useState('Manual adjustment')
  // transfer form
  const [transferTo, setTransferTo] = useState('')
  const [transferQty, setTransferQty] = useState('1')
  // bulk form
  const [bulkDelta, setBulkDelta] = useState('0')
  const [bulkReason, setBulkReason] = useState('Bulk adjustment')

  const locationName = (id: string) => locations.find((l) => l.id === id)?.name ?? 'Location'

  const openAdjust = (row: InventoryRow) => {
    setAdjustQty(String(row.available))
    setAdjustReason('Manual adjustment')
    setAdjustRow(row)
  }
  const openTransfer = (row: InventoryRow) => {
    const other = locations.find((l) => l.id !== row.locationId)
    setTransferTo(other?.id ?? '')
    setTransferQty('1')
    setTransferRow(row)
  }
  const openHistory = async (row: InventoryRow) => {
    setHistoryRow({ sku: row.sku, title: `${row.productTitle}${row.variantTitle ? ` · ${row.variantTitle}` : ''}` })
    setHistory(await historyFor(row.variantId))
  }

  const scopedRows = useMemo(
    () => (locationId ? rows.filter((r) => r.locationId === locationId) : rows),
    [rows, locationId],
  )

  const filters: FilterDef<InventoryRow>[] = [
    {
      key: 'stock', label: 'Stock level', type: 'select',
      options: [
        { label: 'In stock', value: 'in' },
        { label: 'Low (≤8)', value: 'low' },
        { label: 'Out of stock', value: 'out' },
      ],
      predicate: (r, v) => {
        if (v === 'in') return r.available > 8
        if (v === 'low') return r.available > 0 && r.available <= 8
        return r.available === 0
      },
    },
    {
      key: 'vendor', label: 'Vendor', type: 'select',
      optionsFrom: (rws) => {
        const products = useStore.getState().products
        return [...new Set(rws.map((r) => products.find((p) => p.id === r.productId)?.vendor ?? ''))]
          .filter(Boolean)
          .sort()
          .map((x) => ({ label: x, value: x }))
      },
      predicate: (r, v) => (useStore.getState().products.find((p) => p.id === r.productId)?.vendor ?? '') === v,
    },
  ]

  const columns: Column<InventoryRow>[] = [
    {
      key: 'product', header: 'Product', sortValue: (r) => r.productTitle.toLowerCase(),
      render: (r) => (
        <span className="flex items-center gap-3">
          {r.imageSrc ? (
            <img src={r.imageSrc} alt="" className="h-8 w-8 shrink-0 rounded-md border border-border object-cover" />
          ) : (
            <span className="h-8 w-8 shrink-0 rounded-md bg-[#f1f1f1]" />
          )}
          <span className="min-w-0">
            <Link to={`/products/${r.productId}`} className="block truncate text-[13px] font-medium hover:text-accent hover:underline" onClick={(e) => e.stopPropagation()}>
              {r.productTitle}
            </Link>
            {r.variantTitle && <span className="block truncate text-xs text-text-muted">{r.variantTitle}</span>}
          </span>
        </span>
      ),
    },
    { key: 'sku', header: 'SKU', sortValue: (r) => r.sku, render: (r) => <span className="text-text-muted">{r.sku || '—'}</span> },
    {
      key: 'available', header: 'Available', align: 'right', sortValue: (r) => r.available,
      render: (r) =>
        r.available === 0 ? (
          <Badge tone="critical" dot>0</Badge>
        ) : r.available <= 8 ? (
          <Badge tone="warning" dot>{r.available}</Badge>
        ) : (
          <span className="font-medium">{r.available}</span>
        ),
    },
    { key: 'committed', header: 'Committed', align: 'right', sortValue: (r) => r.committed, render: (r) => r.committed || <span className="text-text-subdued">0</span> },
    { key: 'unavailable', header: 'Unavailable', align: 'right', sortValue: (r) => r.unavailable, render: (r) => r.unavailable || <span className="text-text-subdued">0</span> },
    { key: 'onHand', header: 'On hand', align: 'right', sortValue: (r) => r.onHand, render: (r) => <span className="font-medium">{r.onHand}</span> },
    ...(locationId ? [] : [{ key: 'loc', header: 'Location', sortValue: (r: InventoryRow) => r.locationName, render: (r: InventoryRow) => <span className="text-text-muted">{r.locationName}</span> } as Column<InventoryRow>]),
  ]

  const totalSkus = new Set(scopedRows.map((r) => r.variantId)).size
  const outOfStock = scopedRows.filter((r) => r.available === 0).length

  return (
    <div>
      {confirmElement}
      <PageHeader
        title="Inventory"
        subtitle={`${totalSkus} tracked variant${totalSkus === 1 ? '' : 's'} · ${outOfStock} out of stock`}
      />

      {outOfStock > 0 && (
        <div className="mb-3">
          <Card className="border-[#ecd489] bg-warning-surface-soft">
            <div className="flex items-start gap-2 text-[13px] text-warning">
              <TriangleAlert size={15} className="mt-0.5 shrink-0" />
              <span>
                {outOfStock} variant{outOfStock === 1 ? ' is' : 's are'} out of stock at {locationId ? locationName(locationId) : 'one or more locations'}.
                Adjust quantities or transfer stock from another location.
              </span>
            </div>
          </Card>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-text-muted">Location:</span>
        <Select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="max-w-xs"
          options={[{ label: 'All locations', value: '' }, ...locations.map((l) => ({ label: l.name, value: l.id }))]}
        />
      </div>

      <DataTable
        rows={scopedRows}
        columns={columns}
        rowKey={(r) => `${r.variantId}:${r.locationId}`}
        searchKeys={(r) => [r.productTitle, r.variantTitle, r.sku]}
        searchPlaceholder="Search by product or SKU"
        filters={filters}
        selectable={canEdit}
        bulkActions={
          canEdit
            ? [
                {
                  label: 'Adjust quantity',
                  onRun: (ids: string[]) => {
                    setBulkDelta('0')
                    setBulkReason('Bulk adjustment')
                    setBulkRows(scopedRows.filter((r) => ids.includes(`${r.variantId}:${r.locationId}`)))
                  },
                },
              ]
            : []
        }
        initialSort={{ key: 'available', dir: 'asc' }}
        hasAnyData={rows.length > 0}
        emptyNoData={
          <EmptyState
            icon={Package}
            heading="No inventory records"
            message="Stock levels appear once products have inventory at your locations."
          />
        }
        rowActions={(r) => (
          <PortalMenu
            align="right"
            trigger={
              <button aria-label={`Actions for ${r.sku || r.productTitle}`} className="rounded-md p-1.5 text-text-muted hover:bg-[#e3e3e3] hover:text-text">
                <MoreVertical size={15} />
              </button>
            }
            items={[
              { label: 'Adjust quantity', onClick: () => openAdjust(r), disabled: !canEdit },
              { label: 'Transfer', icon: <ArrowLeftRight size={13} />, onClick: () => openTransfer(r), disabled: !canEdit || locations.length < 2 },
              { label: 'Inventory history', icon: <History size={13} />, onClick: () => void openHistory(r) },
            ]}
          />
        )}
      />

      {/* Adjust drawer */}
      <Drawer
        open={!!adjustRow}
        onClose={() => setAdjustRow(null)}
        title="Adjust inventory"
        subtitle={adjustRow ? `${adjustRow.productTitle}${adjustRow.variantTitle ? ` · ${adjustRow.variantTitle}` : ''} — ${adjustRow.locationName}` : undefined}
        footer={
          <>
            <Button onClick={() => setAdjustRow(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!adjustRow) return
                const next = Number(adjustQty)
                try {
                  await adjustInventory(adjustRow.variantId, adjustRow.locationId, next, adjustReason)
                  toast('Inventory adjusted')
                  setAdjustRow(null)
                } catch (e) {
                  toast(e instanceof Error ? e.message : 'Failed to adjust', { tone: 'critical' })
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        {adjustRow && (
          <div className="space-y-3">
            <Input
              label={`New available quantity at ${adjustRow.locationName}`}
              type="number"
              min="0"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              helpText={`Currently ${adjustRow.available} available · committed ${adjustRow.committed} · unavailable ${adjustRow.unavailable}`}
            />
            <Textarea
              label="Reason"
              rows={2}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
            <p className="text-xs text-text-muted">Committed and unavailable units are managed automatically by orders.</p>
          </div>
        )}
      </Drawer>

      {/* Transfer drawer */}
      <Drawer
        open={!!transferRow}
        onClose={() => setTransferRow(null)}
        title="Transfer inventory"
        subtitle={transferRow ? `${transferRow.productTitle}${transferRow.variantTitle ? ` · ${transferRow.variantTitle}` : ''}` : undefined}
        footer={
          <>
            <Button onClick={() => setTransferRow(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!transferRow) return
                try {
                  await transferInventory({
                    variantId: transferRow.variantId,
                    fromLocationId: transferRow.locationId,
                    toLocationId: transferTo,
                    quantity: Number(transferQty),
                  })
                  toast('Transfer recorded')
                  setTransferRow(null)
                } catch (e) {
                  toast(e instanceof Error ? e.message : 'Transfer failed', { tone: 'critical' })
                }
              }}
            >
              Transfer
            </Button>
          </>
        }
      >
        {transferRow && (
          <div className="space-y-3">
            <Input
              label={`From: ${transferRow.locationName}`}
              value={`${transferRow.available} available`}
              disabled
            />
            <Select
              label="To location"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              options={locations.filter((l) => l.id !== transferRow.locationId).map((l) => ({ label: l.name, value: l.id }))}
            />
            <Input
              label="Quantity to transfer"
              type="number"
              min="1"
              max={transferRow.available}
              value={transferQty}
              onChange={(e) => setTransferQty(e.target.value)}
            />
          </div>
        )}
      </Drawer>

      {/* Bulk adjust drawer */}
      <Drawer
        open={!!bulkRows}
        onClose={() => setBulkRows(null)}
        title={`Adjust ${bulkRows?.length ?? 0} inventory records`}
        subtitle="Applies the same quantity change to each selected record"
        footer={
          <>
            <Button onClick={() => setBulkRows(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!bulkRows) return
                const delta = Number(bulkDelta)
                if (!delta) {
                  toast('Enter a non-zero change', { tone: 'warning' })
                  return
                }
                let changed = 0
                for (const r of bulkRows) {
                  const next = Math.max(0, r.available + delta)
                  if (next !== r.available) {
                    await adjustInventory(r.variantId, r.locationId, next, bulkReason)
                    changed++
                  }
                }
                toast(`Adjusted ${changed} record${changed === 1 ? '' : 's'}`)
                setBulkRows(null)
              }}
            >
              Apply
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Change quantity by (±)"
            type="number"
            value={bulkDelta}
            onChange={(e) => setBulkDelta(e.target.value)}
            helpText="Example: -5 reduces each record by 5. Results clamp at 0."
          />
          <Input label="Reason" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} />
          <ul className="divide-y divide-border rounded-lg border border-border text-[13px]">
            {bulkRows?.slice(0, 8).map((r) => (
              <li key={`${r.variantId}:${r.locationId}`} className="flex justify-between px-3 py-1.5">
                <span className="truncate">{r.productTitle} {r.variantTitle && `· ${r.variantTitle}`}</span>
                <span className="text-text-muted">{r.available} → {Math.max(0, r.available + Number(bulkDelta || 0))}</span>
              </li>
            ))}
            {(bulkRows?.length ?? 0) > 8 && (
              <li className="px-3 py-1.5 text-xs text-text-muted">and {(bulkRows?.length ?? 0) - 8} more…</li>
            )}
          </ul>
        </div>
      </Drawer>

      {/* History drawer */}
      <Drawer
        open={!!historyRow}
        onClose={() => setHistoryRow(null)}
        title="Inventory history"
        subtitle={historyRow?.title}
      >
        {history.length === 0 ? (
          <EmptyState compact icon={History} heading="No history yet" message="Adjustments and transfers will be recorded here." />
        ) : (
          <ol className="space-y-3">
            {history.map((h) => (
              <li key={h.id} className="flex gap-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${h.change >= 0 ? 'bg-success' : 'bg-critical-strong'}`} aria-hidden />
                <div>
                  <p className="text-[13px]">
                    {h.change >= 0 ? '+' : ''}{h.change} · {h.reason}
                    <span className="text-text-muted"> ({locationName(h.locationId)})</span>
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatRelative(h.createdAt)} · {h.author} · {h.resultingAvailable} on hand after
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Drawer>
    </div>
  )
}
