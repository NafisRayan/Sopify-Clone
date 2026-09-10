import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { DataTable, type Column, type FilterDef } from '@/components/data-table/DataTable'
import { Badge, Button, EmptyState, Input, Modal, PortalMenu, Select, useConfirm, useToast } from '@/components/ui'
import { formatDate, formatMoney, formatPercent, initials } from '@/lib/format'
import { companySpend, createCompany, deleteCompany } from '@/services/parityService'
import { useCan } from '@/lib/permissions'
import type { Company } from '@/types/parity'

export default function CompaniesListPage() {
  const companies = useStore((s) => s.companies)
  const customers = useStore((s) => s.customers)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', customerId: '', locationName: '', address1: '', city: '', province: '', zip: '', discount: '10' })
  const canEdit = useCan('customers', 'edit')
  const canRemove = useCan('customers', 'delete')

  const filters: FilterDef<Company>[] = [
    {
      key: 'status', label: 'Status', type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
      ],
      predicate: (c, v) => c.status === v,
    },
  ]

  const columns: Column<Company>[] = [
    {
      key: 'name', header: 'Company', sortValue: (c) => c.name.toLowerCase(),
      render: (c) => (
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-highlight text-[11px] font-bold text-[#5b3ba8]">
            {initials(c.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{c.name}</span>
            <span className="block truncate text-xs text-text-muted">{c.locations.length} location{c.locations.length === 1 ? '' : 's'} · {c.contacts.length} contact{c.contacts.length === 1 ? '' : 's'}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'buyer', header: 'Primary buyer',
      render: (c) => {
        const cust = customers.find((x) => x.id === c.customerId)
        return <span className="text-text-muted">{cust ? `${cust.firstName} ${cust.lastName}` : '—'}</span>
      },
    },
    {
      key: 'discount', header: 'Price list', sortValue: (c) => c.priceListDiscountPercent,
      render: (c) => <Badge tone="highlight">−{formatPercent(c.priceListDiscountPercent, 0)}</Badge>,
    },
    {
      key: 'spend', header: 'Spent to date', align: 'right', sortValue: (c) => companySpend(c),
      render: (c) => <span className="font-medium">{formatMoney(companySpend(c))}</span>,
    },
    {
      key: 'created', header: 'Created', sortValue: (c) => c.createdAt,
      render: (c) => <span className="text-text-muted">{formatDate(c.createdAt)}</span>,
    },
  ]

  const submitCreate = async () => {
    if (!form.name.trim() || !form.customerId) {
      toast('Company name and primary buyer are required', { tone: 'critical' })
      return
    }
    try {
      const created = await createCompany({
        name: form.name,
        customerId: form.customerId,
        locationName: form.locationName,
        address: {
          firstName: '', lastName: '', address1: form.address1,
          city: form.city, province: form.province, country: 'United States', zip: form.zip,
        },
        priceListDiscountPercent: Number(form.discount) || 0,
      })
      toast('Company created')
      setCreateOpen(false)
      setForm({ name: '', customerId: '', locationName: '', address1: '', city: '', province: '', zip: '', discount: '10' })
      navigate(`/companies/${created.id}`)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to create company', { tone: 'critical' })
    }
  }

  return (
    <div>
      {confirmElement}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add company"
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void submitCreate()}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select
            label="Primary buyer"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            options={[{ label: 'Select a customer…', value: '' }, ...customers.map((c) => ({ label: `${c.firstName} ${c.lastName} (${c.email})`, value: c.id }))]}
          />
          <Input label="Main location name" value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} placeholder="e.g. Headquarters" />
          <Input label="Street address" value={form.address1} onChange={(e) => setForm({ ...form, address1: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="State" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
            <Input label="ZIP" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
          </div>
          <Input label="B2B price list discount (%)" type="number" min="0" max="90" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
        </div>
      </Modal>

      <DataTable
        rows={companies}
        columns={columns}
        rowKey={(c) => c.id}
        searchKeys={(c) => [c.name, c.externalId ?? '', ...c.locations.map((l) => l.name), ...c.contacts.map((x) => x.email)]}
        searchPlaceholder="Search companies"
        filters={filters}
        initialSort={{ key: 'name', dir: 'asc' }}
        onRowClick={(c) => navigate(`/companies/${c.id}`)}
        hasAnyData={companies.length > 0}
        toolbarExtra={
          <Button size="sm" variant="primary" icon={<Plus size={13} />} onClick={() => setCreateOpen(true)} disabled={!canEdit}>
            Add company
          </Button>
        }
        emptyNoData={
          <EmptyState
            icon={Building2}
            heading="No B2B companies yet"
            message="Companies group business buyers with custom price lists and multiple locations."
            primaryAction={canEdit ? { label: 'Add company', onClick: () => setCreateOpen(true) } : undefined}
          />
        }
        rowActions={(c) => (
          <PortalMenu
            align="right"
            trigger={
              <button aria-label={`Actions for ${c.name}`} className="rounded-md p-1.5 text-text-muted hover:bg-[#e3e3e3] hover:text-text">
                <MoreVertical size={15} />
              </button>
            }
            items={[
              { label: 'Open', onClick: () => navigate(`/companies/${c.id}`) },
              ...(canRemove
                ? [{
                    label: 'Delete', icon: <Trash2 size={13} />, destructive: true,
                    onClick: () =>
                      confirm({
                        title: `Delete ${c.name}?`,
                        body: 'Its locations and contacts will be removed. Customer accounts are not affected.',
                        confirmLabel: 'Delete',
                        destructive: true,
                        onConfirm: async () => {
                          await deleteCompany(c.id)
                          toast('Company deleted', { tone: 'critical' })
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
