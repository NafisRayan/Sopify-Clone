import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MapPin, Plus, UserPlus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Badge, Button, Card, CardHeader, DividedCard, Drawer, EmptyState, Input, PageHeader, useConfirm, useToast } from '@/components/ui'
import { formatMoney, formatPercent, initials } from '@/lib/format'
import { addCompanyContact, addCompanyLocation, companySpend, deleteCompany, updateCompany } from '@/services/parityService'
import { ordersForCustomer } from '@/store/selectors'
import { useCan } from '@/lib/permissions'

export default function CompanyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const company = useStore((s) => s.companies.find((c) => c.id === id))
  const customer = useStore((s) => s.customers.find((c) => c.id === company?.customerId))
  const orders = useStore((s) => s.orders)
  const [locationOpen, setLocationOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [locationForm, setLocationForm] = useState({ name: '', address1: '', city: '', province: '', zip: '' })
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' })
  const [discountDraft, setDiscountDraft] = useState<string | null>(null)
  const canEdit = useCan('customers', 'edit')
  const canRemove = useCan('customers', 'delete')

  const companyOrders = useMemo(() => (customer ? ordersForCustomer(customer.id) : []), [orders, customer])

  if (!company) {
    return (
      <div>
        <PageHeader title="Company not found" backTo="/companies" backLabel="Companies" />
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState heading="Company not found" primaryAction={{ label: 'Back to companies', onClick: () => navigate('/companies') }} />
        </div>
      </div>
    )
  }

  return (
    <div>
      {confirmElement}
      <PageHeader
        title={company.name}
        subtitle={`B2B company · added ${new Date(company.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
        backTo="/companies"
        backLabel="Companies"
        secondaryActions={
          canRemove ? (
            <Button
              variant="destructive"
              onClick={() =>
                confirm({
                  title: `Delete ${company.name}?`,
                  body: 'Its locations and contacts will be removed.',
                  confirmLabel: 'Delete',
                  destructive: true,
                  onConfirm: async () => {
                    await deleteCompany(company.id)
                    toast('Company deleted', { tone: 'critical' })
                    navigate('/companies')
                  },
                })
              }
            >
              Delete
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        {[
          { label: 'Locations', value: String(company.locations.length) },
          { label: 'Contacts', value: String(company.contacts.length) },
          { label: 'Price list discount', value: `−${formatPercent(company.priceListDiscountPercent, 0)}` },
          { label: 'Spent to date', value: formatMoney(companySpend(company)) },
        ].map((s) => (
          <Card key={s.label} className="min-w-[140px] flex-1">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className="mt-1 text-lg font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <DividedCard>
            <CardHeader
              title={`Locations (${company.locations.length})`}
              actions={
                canEdit && (
                  <Button size="sm" icon={<Plus size={12} />} onClick={() => setLocationOpen(true)}>
                    Add location
                  </Button>
                )
              }
            />
            <ul className="divide-y divide-border">
              {company.locations.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <span className="flex items-start gap-2.5 text-[13px]">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-text-muted" />
                    <span>
                      <span className="block font-medium">{l.name}</span>
                      <span className="block text-xs text-text-muted">
                        {l.address.address1}, {l.address.city} {l.address.province} {l.address.zip}
                      </span>
                    </span>
                  </span>
                  {l.taxExempt && <Badge tone="info">Tax exempt</Badge>}
                </li>
              ))}
            </ul>
          </DividedCard>

          <DividedCard>
            <CardHeader
              title={`Contacts (${company.contacts.length})`}
              actions={
                canEdit && (
                  <Button size="sm" icon={<UserPlus size={12} />} onClick={() => setContactOpen(true)}>
                    Add contact
                  </Button>
                )
              }
            />
            {company.contacts.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-text-muted">No contacts yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {company.contacts.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e3e3e3] text-[11px] font-semibold">
                      {initials(c.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{c.name}</span>
                      <span className="block truncate text-xs text-text-muted">{c.email}</span>
                    </span>
                    {c.isPrimary && <Badge tone="success">Primary</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </DividedCard>

          <DividedCard>
            <CardHeader
              title={`Orders (${companyOrders.length})`}
              subtitle={`Through primary buyer${customer ? ` ${customer.firstName} ${customer.lastName}` : ''}`}
              actions={
                customer && (
                  <Link to={`/customers/${customer.id}`} className="text-xs text-accent hover:underline">
                    View customer
                  </Link>
                )
              }
            />
            {companyOrders.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-text-muted">No orders yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {companyOrders.slice(0, 8).map((o) => (
                  <li key={o.id}>
                    <Link to={`/orders/${o.id}`} className="flex items-center justify-between px-4 py-2 text-[13px] hover:bg-surface-hover">
                      <span className="font-medium">{o.name}</span>
                      <span className="text-text-muted">{formatMoney(o.total)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DividedCard>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-[13px] font-semibold">Price list</h3>
            <p className="mt-1 text-xs text-text-muted">
              Catalog prices shown to this company are reduced by the discount below.
            </p>
            {canEdit ? (
              discountDraft !== null ? (
                <div className="mt-2 flex items-end gap-2">
                  <Input
                    label="Discount %"
                    type="number"
                    min="0"
                    max="90"
                    value={discountDraft}
                    onChange={(e) => setDiscountDraft(e.target.value)}
                    className="max-w-[100px]"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      void updateCompany(company.id, { priceListDiscountPercent: Number(discountDraft) || 0 }).then(() => {
                        toast('Price list updated')
                        setDiscountDraft(null)
                      })
                    }
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <button className="mt-2 text-[13px] font-medium text-accent hover:underline" onClick={() => setDiscountDraft(String(company.priceListDiscountPercent))}>
                  −{formatPercent(company.priceListDiscountPercent, 0)} — Edit
                </button>
              )
            ) : (
              <p className="mt-2 text-[13px]">−{formatPercent(company.priceListDiscountPercent, 0)}</p>
            )}
          </Card>

          {company.note && (
            <Card>
              <h3 className="text-[13px] font-semibold">Note</h3>
              <p className="mt-1.5 text-[13px] text-text-muted">{company.note}</p>
            </Card>
          )}

          <Card>
            <h3 className="text-[13px] font-semibold">External ID</h3>
            <p className="mt-1 text-[13px] text-text-muted">{company.externalId || '—'}</p>
          </Card>
        </div>
      </div>

      {/* Add location drawer */}
      <Drawer
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        title="Add company location"
        footer={
          <>
            <Button onClick={() => setLocationOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!locationForm.name.trim() || !locationForm.address1.trim()) {
                  toast('Name and street are required', { tone: 'critical' })
                  return
                }
                await addCompanyLocation(company.id, locationForm.name, {
                  firstName: '', lastName: '', address1: locationForm.address1,
                  city: locationForm.city, province: locationForm.province, country: 'United States', zip: locationForm.zip,
                })
                toast('Location added')
                setLocationOpen(false)
                setLocationForm({ name: '', address1: '', city: '', province: '', zip: '' })
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Location name" value={locationForm.name} onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} />
          <Input label="Street address" value={locationForm.address1} onChange={(e) => setLocationForm({ ...locationForm, address1: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="City" value={locationForm.city} onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })} />
            <Input label="State" value={locationForm.province} onChange={(e) => setLocationForm({ ...locationForm, province: e.target.value })} />
            <Input label="ZIP" value={locationForm.zip} onChange={(e) => setLocationForm({ ...locationForm, zip: e.target.value })} />
          </div>
        </div>
      </Drawer>

      {/* Add contact drawer */}
      <Drawer
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Add company contact"
        footer={
          <>
            <Button onClick={() => setContactOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!contactForm.name.trim() || !contactForm.email.trim()) {
                  toast('Name and email are required', { tone: 'critical' })
                  return
                }
                try {
                  await addCompanyContact(company.id, { name: contactForm.name, email: contactForm.email, phone: contactForm.phone || undefined })
                  toast('Contact added')
                  setContactOpen(false)
                  setContactForm({ name: '', email: '', phone: '' })
                } catch (e) {
                  toast(e instanceof Error ? e.message : 'Failed', { tone: 'critical' })
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Full name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
          <Input label="Email" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
          <Input label="Phone (optional)" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
        </div>
      </Drawer>
    </div>
  )
}
