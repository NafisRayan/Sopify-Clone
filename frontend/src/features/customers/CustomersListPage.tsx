import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, UserPlus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { customerStats } from '@/store/selectors'
import { DataTable, type Column, type FilterDef, type BulkActionDef } from '@/components/data-table/DataTable'
import {
  Badge, Button, Drawer, EmptyState, Input, PortalMenu, TagInput, Textarea, useConfirm, useToast,
} from '@/components/ui'
import { formatDate, formatMoney, initials } from '@/lib/format'
import { CONSENT_LABELS } from '@/lib/constants'
import { addCustomerTags, createCustomer, deleteCustomers, removeCustomerTags } from '@/services/customersService'
import { useCan } from '@/lib/permissions'
import { ExportButton } from '@/components/ExportButton'
import type { Customer, MarketingConsent } from '@/types'

function consentTone(c: MarketingConsent) {
  return c === 'subscribed' ? 'success' : c === 'pending' ? 'warning' : 'neutral'
}

export default function CustomersListPage() {
  const customers = useStore((s) => s.customers)
  const orders = useStore((s) => s.orders)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const [createOpen, setCreateOpen] = useState(false)
  const [tagDrawerIds, setTagDrawerIds] = useState<{ ids: string[]; mode: 'add' | 'remove' } | null>(null)
  const [tagDraft, setTagDraft] = useState<string[]>([])
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', note: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({})
  const [saving, setSaving] = useState(false)

  const canRemove = useCan('customers', 'delete')
  const canEdit = useCan('customers', 'edit')

  const tagOptions = useMemo(
    () => [...new Set(customers.flatMap((c) => c.tags))].sort().map((t) => ({ label: t, value: t })),
    [customers],
  )

  const filters: FilterDef<Customer>[] = [
    {
      key: 'country', label: 'Location', type: 'select',
      optionsFrom: (rows) =>
        [...new Set(rows.map((c) => c.defaultAddress?.country).filter(Boolean) as string[])]
          .sort()
          .map((x) => ({ label: x, value: x })),
      predicate: (c, v) => c.defaultAddress?.country === v,
    },
    {
      key: 'orders', label: 'Orders', type: 'number-range',
      predicate: (c, v) => {
        const n = customerStats(c.id).ordersCount
        const { min, max } = v as { min?: number; max?: number }
        if (min !== undefined && n < min) return false
        if (max !== undefined && n > max) return false
        return true
      },
    },
    {
      key: 'spent', label: 'Amount spent', type: 'number-range',
      predicate: (c, v) => {
        const n = customerStats(c.id).totalSpent
        const { min, max } = v as { min?: number; max?: number }
        if (min !== undefined && n < min) return false
        if (max !== undefined && n > max) return false
        return true
      },
    },
    {
      key: 'consent', label: 'Email consent', type: 'select',
      options: (Object.keys(CONSENT_LABELS) as MarketingConsent[]).map((k) => ({ label: CONSENT_LABELS[k], value: k })),
      predicate: (c, v) => c.emailMarketingConsent === v,
    },
    {
      key: 'tag', label: 'Tag', type: 'select',
      optionsFrom: (rows) => [...new Set(rows.flatMap((c) => c.tags))].sort().map((t) => ({ label: t, value: t })),
      predicate: (c, v) => c.tags.includes(v as string),
    },
  ]

  const columns: Column<Customer>[] = [
    {
      key: 'name', header: 'Name', sortValue: (c) => `${c.firstName} ${c.lastName}`.toLowerCase(),
      render: (c) => (
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e3e3e3] text-[11px] font-semibold text-text">
            {initials(`${c.firstName} ${c.lastName}`)}
          </span>
          <span className="font-medium">{c.firstName} {c.lastName}</span>
        </span>
      ),
    },
    { key: 'email', header: 'Email', sortValue: (c) => c.email, render: (c) => <span className="text-text-muted">{c.email}</span> },
    { key: 'phone', header: 'Phone', sortValue: (c) => c.phone ?? '', render: (c) => <span className="text-text-muted">{c.phone || '—'}</span> },
    {
      key: 'orders', header: 'Orders', align: 'right', sortValue: (c) => customerStats(c.id).ordersCount,
      render: (c) => customerStats(c.id).ordersCount,
    },
    {
      key: 'spent', header: 'Amount spent', align: 'right', sortValue: (c) => customerStats(c.id).totalSpent,
      render: (c) => <span className="font-medium">{formatMoney(customerStats(c.id).totalSpent)}</span>,
    },
    {
      key: 'location', header: 'Location', sortValue: (c) => c.defaultAddress?.city ?? '',
      render: (c) => <span className="text-text-muted">{c.defaultAddress ? `${c.defaultAddress.city}, ${c.defaultAddress.country}` : '—'}</span>,
    },
    {
      key: 'lastOrder', header: 'Last order', sortValue: (c) => customerStats(c.id).lastOrderAt ?? '',
      render: (c) => {
        const last = customerStats(c.id).lastOrderAt
        return <span className="text-text-muted">{last ? formatDate(last) : '—'}</span>
      },
    },
    {
      key: 'consent', header: 'Consent', sortValue: (c) => c.emailMarketingConsent,
      render: (c) => <Badge tone={consentTone(c.emailMarketingConsent)} dot>{CONSENT_LABELS[c.emailMarketingConsent]}</Badge>,
    },
  ]

  const submitCreate = async () => {
    const errors: Record<string, string | undefined> = {}
    if (!form.firstName.trim()) errors.firstName = 'First name is required'
    if (!form.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email'
    setFormErrors(errors)
    if (Object.keys(errors).some((k) => errors[k])) return
    setSaving(true)
    try {
      const created = await createCustomer({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        note: form.note.trim() || undefined,
      })
      toast('Customer created')
      setCreateOpen(false)
      setForm({ firstName: '', lastName: '', email: '', phone: '', note: '' })
      navigate(`/customers/${created.id}`)
    } catch (e) {
      setFormErrors({ email: e instanceof Error ? e.message : 'Failed to create customer' })
    } finally {
      setSaving(false)
    }
  }

  const bulkActions: BulkActionDef[] = [
    ...(canEdit
      ? [
          { label: 'Add tags', onRun: (ids: string[]) => { setTagDraft([]); setTagDrawerIds({ ids, mode: 'add' }) } },
          { label: 'Remove tags', onRun: (ids: string[]) => { setTagDraft([]); setTagDrawerIds({ ids, mode: 'remove' }) } },
        ]
      : []),
    ...(canRemove
      ? [
          {
            label: 'Delete customers',
            destructive: true,
            onRun: (ids: string[]) =>
              confirm({
                title: `Delete ${ids.length} customer${ids.length === 1 ? '' : 's'}?`,
                body: 'Their orders stay in the system but are shown as coming from a deleted customer. This action cannot be undone.',
                confirmLabel: 'Delete',
                destructive: true,
                onConfirm: async () => {
                  await deleteCustomers(ids)
                  toast(`${ids.length} customer${ids.length === 1 ? '' : 's'} deleted`, { tone: 'critical' })
                },
              }),
          },
        ]
      : []),
  ]

  return (
    <div>
      {confirmElement}
      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add customer"
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={() => void submitCreate()}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" value={form.firstName} error={formErrors.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={form.email} error={formErrors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Textarea label="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} />
        </div>
      </Drawer>

      <Drawer
        open={!!tagDrawerIds}
        onClose={() => setTagDrawerIds(null)}
        title={`${tagDrawerIds?.mode === 'add' ? 'Add' : 'Remove'} tags`}
        subtitle={`${tagDrawerIds?.ids.length ?? 0} customers selected`}
        footer={
          <>
            <Button onClick={() => setTagDrawerIds(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={tagDraft.length === 0}
              onClick={async () => {
                if (!tagDrawerIds) return
                if (tagDrawerIds.mode === 'add') await addCustomerTags(tagDrawerIds.ids, tagDraft)
                else await removeCustomerTags(tagDrawerIds.ids, tagDraft)
                toast(`Tags ${tagDrawerIds.mode === 'add' ? 'added' : 'removed'}`)
                setTagDrawerIds(null)
              }}
            >
              Save
            </Button>
          </>
        }
      >
        {tagDrawerIds?.mode === 'add' ? (
          <TagInput value={tagDraft} onChange={setTagDraft} suggestions={tagOptions.map((o) => o.value)} />
        ) : (
          <TagInput value={tagDraft} onChange={setTagDraft} suggestions={tagOptions.map((o) => o.value)} placeholder="Remove tag (exact name)" />
        )}
      </Drawer>

      <DataTable
        rows={customers}
        columns={columns}
        rowKey={(c) => c.id}
        searchKeys={(c) => [c.firstName, c.lastName, c.email, c.phone ?? '', c.defaultAddress?.city ?? '', ...c.tags]}
        searchPlaceholder="Search customers"
        filters={filters}
        selectable
        bulkActions={bulkActions}
        initialSort={{ key: 'orders', dir: 'desc' }}
        onRowClick={(c) => navigate(`/customers/${c.id}`)}
        hasAnyData={customers.length > 0}
        toolbarExtra={
          <>
            <ExportButton
              filename="customers"
              rows={customers}
              columns={[
                { header: 'First name', value: (c) => c.firstName },
                { header: 'Last name', value: (c) => c.lastName },
                { header: 'Email', value: (c) => c.email },
                { header: 'Orders', value: (c) => customerStats(c.id).ordersCount },
                { header: 'Total spent', value: (c) => customerStats(c.id).totalSpent.toFixed(2) },
              ]}
            />
            <Button size="sm" variant="primary" icon={<UserPlus size={13} />} onClick={() => setCreateOpen(true)} disabled={!canEdit}>
              Add customer
            </Button>
          </>
        }
        emptyNoData={
          <EmptyState
            heading="No customers yet"
            message="Customers appear here after their first order — or add them manually."
            primaryAction={canEdit ? { label: 'Add customer', onClick: () => setCreateOpen(true) } : undefined}
          />
        }
        rowActions={(c) => (
          <PortalMenu
            align="right"
            trigger={
              <button aria-label={`Actions for ${c.firstName} ${c.lastName}`} className="rounded-md p-1.5 text-text-muted hover:bg-[#e3e3e3] hover:text-text">
                <MoreVertical size={15} />
              </button>
            }
            items={[
              { label: 'View', onClick: () => navigate(`/customers/${c.id}`) },
              ...(orders.some((o) => o.customerId === c.id)
                ? [{ label: 'See orders', onClick: () => navigate(`/orders?q=${encodeURIComponent(c.email)}`) }]
                : []),
              ...(canRemove
                ? [{
                    label: 'Delete', destructive: true, separatorBefore: true,
                    onClick: () =>
                      confirm({
                        title: `Delete ${c.firstName} ${c.lastName}?`,
                        body: 'Their orders will remain but show as a deleted customer.',
                        confirmLabel: 'Delete',
                        destructive: true,
                        onConfirm: async () => {
                          await deleteCustomers([c.id])
                          toast('Customer deleted', { tone: 'critical' })
                        },
                      }),
                  }]
                : []),
            ]}
          />
        )}
      />
    </div>
  )
}
