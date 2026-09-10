import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, Plus, TicketPercent, Trash2, XCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { DataTable, type Column, type FilterDef, type BulkActionDef } from '@/components/data-table/DataTable'
import { Badge, Button, EmptyState, PageHeader, PortalMenu, useConfirm, useToast } from '@/components/ui'
import { formatDate, formatMoney } from '@/lib/format'
import { DISCOUNT_STATUS_LABELS, DISCOUNT_TYPE_LABELS } from '@/lib/constants'
import { deleteDiscounts, discountStatusNow, setDiscountsStatus } from '@/services/discountsService'
export { discountStatusNow }
import { useCan } from '@/lib/permissions'
import { ExportButton } from '@/components/ExportButton'
import type { Discount, DiscountStatus, DiscountType } from '@/types'

export function statusTone(s: DiscountStatus) {
  return s === 'active' ? 'success' : s === 'scheduled' ? 'info' : s === 'expired' ? 'neutral' : 'warning'
}

function discountValue(d: Discount): string {
  switch (d.type) {
    case 'percentage': return `${d.value}% off`
    case 'fixed_amount': return `${formatMoney(d.value ?? 0)} off`
    case 'free_shipping': return 'Free shipping'
    case 'bxgy': return `Buy ${d.bxgy?.customerBuysQuantity ?? 1} get ${d.bxgy?.customerGetsQuantity ?? 1} ${(d.bxgy?.customerGetsDiscountPercent ?? 100) === 100 ? 'free' : `${d.bxgy?.customerGetsDiscountPercent}% off`}`
  }
}

export default function DiscountsListPage() {
  const discounts = useStore((s) => s.discounts)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const canEdit = useCan('products', 'edit')

  const filters: FilterDef<Discount>[] = [
    {
      key: 'status', label: 'Status', type: 'multiselect',
      options: (Object.keys(DISCOUNT_STATUS_LABELS) as DiscountStatus[]).map((k) => ({ label: DISCOUNT_STATUS_LABELS[k], value: k })),
      predicate: (d, v) => Array.isArray(v) && v.includes(discountStatusNow(d)),
    },
    {
      key: 'method', label: 'Method', type: 'select',
      options: [
        { label: 'Discount code', value: 'code' },
        { label: 'Automatic', value: 'automatic' },
      ],
      predicate: (d, v) => d.method === v,
    },
    {
      key: 'type', label: 'Type', type: 'select',
      options: (Object.keys(DISCOUNT_TYPE_LABELS) as DiscountType[]).map((k) => ({ label: DISCOUNT_TYPE_LABELS[k], value: k })),
      predicate: (d, v) => d.type === v,
    },
  ]

  const columns: Column<Discount>[] = [
    {
      key: 'code', header: 'Discount', sortValue: (d) => d.code.toLowerCase(),
      render: (d) => (
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-highlight text-highlight-border">
            <TicketPercent size={14} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{d.code}</span>
            <span className="block truncate text-xs text-text-muted">{d.title}</span>
          </span>
        </span>
      ),
    },
    { key: 'type', header: 'Type', sortValue: (d) => d.type, render: (d) => <span>{DISCOUNT_TYPE_LABELS[d.type]}</span> },
    { key: 'value', header: 'Value', sortValue: (d) => d.value ?? 0, render: (d) => <span>{discountValue(d)}</span> },
    {
      key: 'method', header: 'Method', sortValue: (d) => d.method,
      render: (d) => <Badge tone={d.method === 'automatic' ? 'highlight' : 'neutral'}>{d.method === 'automatic' ? 'Automatic' : 'Code'}</Badge>,
    },
    {
      key: 'used', header: 'Used', align: 'right', sortValue: (d) => d.usedCount,
      render: (d) => (
        <span className="text-text-muted">
          {d.usedCount}{d.usageLimit ? ` / ${d.usageLimit}` : ''}
        </span>
      ),
    },
    { key: 'starts', header: 'Starts', sortValue: (d) => d.startsAt, render: (d) => <span className="text-text-muted">{formatDate(d.startsAt)}</span> },
    { key: 'ends', header: 'Ends', sortValue: (d) => d.endsAt ?? '', render: (d) => <span className="text-text-muted">{d.endsAt ? formatDate(d.endsAt) : '—'}</span> },
    {
      key: 'status', header: 'Status', sortValue: (d) => discountStatusNow(d),
      render: (d) => <Badge tone={statusTone(discountStatusNow(d))} dot>{DISCOUNT_STATUS_LABELS[discountStatusNow(d)]}</Badge>,
    },
  ]

  const deactivate = async (ids: string[]) => {
    await setDiscountsStatus(ids, 'draft')
    toast(`${ids.length} discount${ids.length === 1 ? '' : 's'} deactivated`)
  }

  const bulkActions: BulkActionDef[] = [
    ...(canEdit
      ? [
          { label: 'Activate', onRun: (ids: string[]) => void setDiscountsStatus(ids, 'active').then(() => toast('Activated')) },
          { label: 'Deactivate', icon: <XCircle size={12} />, onRun: (ids: string[]) => void deactivate(ids) },
          {
            label: 'Delete',
            icon: <Trash2 size={12} />,
            destructive: true,
            onRun: (ids: string[]) =>
              confirm({
                title: `Delete ${ids.length} discount${ids.length === 1 ? '' : 's'}?`,
                body: 'Customers will no longer be able to use these discounts. This cannot be undone.',
                confirmLabel: 'Delete',
                destructive: true,
                onConfirm: async () => {
                  await deleteDiscounts(ids)
                  toast('Discounts deleted', { tone: 'critical' })
                },
              }),
          },
        ]
      : []),
  ]

  const activeCount = useMemo(() => discounts.filter((d) => discountStatusNow(d) === 'active').length, [discounts])

  return (
    <div>
      {confirmElement}
      <PageHeader title="Discounts" subtitle={`${activeCount} active of ${discounts.length} total`} />
      <DataTable
        rows={discounts}
        columns={columns}
        rowKey={(d) => d.id}
        searchKeys={(d) => [d.code, d.title]}
        searchPlaceholder="Search discounts"
        filters={filters}
        selectable={canEdit}
        bulkActions={bulkActions}
        initialSort={{ key: 'status', dir: 'asc' }}
        onRowClick={(d) => navigate(`/discounts/${d.id}`)}
        hasAnyData={discounts.length > 0}
        toolbarExtra={
          <>
            <ExportButton
              filename="discounts"
              rows={discounts}
              columns={[
                { header: 'Code', value: (d) => d.code },
                { header: 'Type', value: (d) => d.type },
                { header: 'Method', value: (d) => d.method },
                { header: 'Used', value: (d) => d.usedCount },
                { header: 'Status', value: (d) => discountStatusNow(d) },
              ]}
            />
            <Button size="sm" variant="primary" icon={<Plus size={13} />} onClick={() => navigate('/discounts/new')} disabled={!canEdit}>
              Create discount
            </Button>
          </>
        }
        emptyNoData={
          <EmptyState
            icon={TicketPercent}
            heading="No discounts yet"
            message="Create discount codes or automatic discounts to run promotions."
            primaryAction={canEdit ? { label: 'Create discount', onClick: () => navigate('/discounts/new') } : undefined}
          />
        }
        rowActions={(d) => (
          <PortalMenu
            align="right"
            trigger={
              <button aria-label={`Actions for ${d.code}`} className="rounded-md p-1.5 text-text-muted hover:bg-[#e3e3e3] hover:text-text">
                <MoreVertical size={15} />
              </button>
            }
            items={[
              { label: 'Edit', onClick: () => navigate(`/discounts/${d.id}`) },
              ...(canEdit
                ? [
                    discountStatusNow(d) === 'active'
                      ? { label: 'Deactivate', onClick: () => void deactivate([d.id]) }
                      : { label: 'Activate', onClick: () => void setDiscountsStatus([d.id], 'active').then(() => toast('Activated')) },
                    {
                      label: 'Delete', destructive: true, separatorBefore: true,
                      onClick: () =>
                        confirm({
                          title: `Delete ${d.code}?`,
                          body: 'Customers will no longer be able to use this discount.',
                          confirmLabel: 'Delete',
                          destructive: true,
                          onConfirm: async () => {
                            await deleteDiscounts([d.id])
                            toast('Discount deleted', { tone: 'critical' })
                          },
                        }),
                    },
                  ]
                : []),
            ]}
          />
        )}
      />
    </div>
  )
}
