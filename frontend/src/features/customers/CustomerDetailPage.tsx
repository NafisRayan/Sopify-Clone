import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Mail, MapPin, Pencil, Phone, Plus, Trash2, UserRound } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { customerStats, ordersForCustomer } from '@/store/selectors'
import {
  Badge, Button, Card, CardHeader, CardSection, DividedCard, Drawer, EmptyState, Input,
  PageHeader, PortalMenu, Select, TagInput, Textarea, Toggle, useConfirm, useToast,
} from '@/components/ui'
import { formatDate, formatMoney, formatRelative } from '@/lib/format'
import { CONSENT_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/constants'
import { paymentTone } from '@/features/orders/OrdersListPage'
import { addAddress, deleteCustomers, setConsent, setDefaultAddress, updateCustomer } from '@/services/customersService'
import { useCan } from '@/lib/permissions'
import type { Address } from '@/types'

export default function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const customer = useStore((s) => s.customers.find((c) => c.id === id))
  const orders = useStore((s) => s.orders)
  const [editOpen, setEditOpen] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)
  const [addressOpen, setAddressOpen] = useState(false)
  const [tagDraft, setTagDraft] = useState<string[]>([])
  const [edit, setEdit] = useState({ firstName: '', lastName: '', email: '', phone: '', note: '' })
  const [addressForm, setAddressForm] = useState<Address>({
    firstName: '', lastName: '', address1: '', address2: '', city: '', province: '', country: 'United States', zip: '',
  })
  const canRemove = useCan('customers', 'delete')
  const canEdit = useCan('customers', 'edit')

  const customerOrders = useMemo(() => (customer ? ordersForCustomer(customer.id) : []), [orders, customer])
  const stats = useMemo(() => (customer ? customerStats(customer.id) : undefined), [customer])

  if (!customer || !stats) {
    return (
      <div>
        <PageHeader title="Customer not found" backTo="/customers" backLabel="Customers" />
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState heading="Customer not found" message="They may have been deleted." primaryAction={{ label: 'Back to customers', onClick: () => navigate('/customers') }} />
        </div>
      </div>
    )
  }

  const openEdit = () => {
    setEdit({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone ?? '',
      note: customer.note ?? '',
    })
    setEditOpen(true)
  }

  return (
    <div>
      {confirmElement}
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        subtitle={`${customer.email} · customer since ${formatDate(customer.createdAt)}`}
        backTo="/customers"
        backLabel="Customers"
        primaryAction={
          canEdit ? (
            <Button variant="primary" icon={<Pencil size={13} />} onClick={openEdit}>
              Edit
            </Button>
          ) : undefined
        }
        secondaryActions={
          <PortalMenu
            align="right"
            trigger={
              <button aria-label="More actions" className="rounded-lg border border-[#d0d0d0] p-2 hover:bg-surface-hover">
                <UserRound size={15} />
              </button>
            }
            items={[
              ...(canRemove
                ? [{
                    label: 'Delete customer', icon: <Trash2 size={13} />, destructive: true,
                    onClick: () =>
                      confirm({
                        title: `Delete ${customer.firstName} ${customer.lastName}?`,
                        body: 'Their orders will remain but show as a deleted customer. This cannot be undone.',
                        confirmLabel: 'Delete',
                        destructive: true,
                        onConfirm: async () => {
                          await deleteCustomers([customer.id])
                          toast('Customer deleted', { tone: 'critical' })
                          navigate('/customers')
                        },
                      }),
                  }]
                : []),
            ]}
          />
        }
      />

      {/* Stats strip */}
      <div className="mb-4 flex flex-wrap gap-3">
        {[
          { label: 'Orders', value: String(stats.ordersCount) },
          { label: 'Total spent', value: formatMoney(stats.totalSpent) },
          { label: 'Average order value', value: formatMoney(stats.avgOrderValue) },
          { label: 'Last order', value: stats.lastOrderAt ? formatDate(stats.lastOrderAt) : '—' },
        ].map((s) => (
          <Card key={s.label} className="min-w-[140px] flex-1">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className="mt-1 text-lg font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Orders */}
        <div className="lg:col-span-2">
          <DividedCard>
            <CardHeader
              title={`Orders (${customerOrders.length})`}
              actions={
                <Link to={`/orders?q=${encodeURIComponent(customer.email)}`} className="text-xs text-accent hover:underline">
                  Search in orders
                </Link>
              }
            />
            {customerOrders.length === 0 ? (
              <EmptyState compact heading="No orders yet" message="This customer hasn't placed an order." />
            ) : (
              <ul className="divide-y divide-border">
                {customerOrders.map((o) => (
                  <li key={o.id}>
                    <Link
                      to={o.isDraft ? `/draft-orders/${o.id}` : `/orders/${o.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover"
                    >
                      <span className="w-14 shrink-0 text-[13px] font-medium">{o.name}</span>
                      <span className="flex-1 truncate text-xs text-text-muted">
                        {o.lineItems.map((li) => li.title).join(', ')}
                      </span>
                      <Badge tone={paymentTone(o.paymentStatus)} dot>{PAYMENT_STATUS_LABELS[o.paymentStatus]}</Badge>
                      <span className="w-16 text-right text-[13px] font-medium">{formatMoney(o.total)}</span>
                      <span className="hidden w-20 text-right text-xs text-text-muted sm:block">{formatDate(o.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DividedCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card padding={false}>
            <CardHeader title="Contact information" />
            <CardSection>
              <ul className="space-y-2 text-[13px]">
                <li className="flex items-center gap-2">
                  <Mail size={13} className="text-text-muted" /> <span className="truncate">{customer.email}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={13} className="text-text-muted" /> {customer.phone || '—'}
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-text-muted" />
                  {customer.defaultAddress ? (
                    <span>
                      {customer.defaultAddress.address1}
                      {customer.defaultAddress.address2 && <>, {customer.defaultAddress.address2}</>}
                      <br />
                      {customer.defaultAddress.city}, {customer.defaultAddress.province} {customer.defaultAddress.zip}
                      <br />
                      {customer.defaultAddress.country}
                    </span>
                  ) : (
                    <span className="text-text-muted">No address on file</span>
                  )}
                </li>
              </ul>
            </CardSection>
          </Card>

          <Card padding={false}>
            <CardHeader title="Marketing consent" />
            <CardSection>
              <Select
                label="Email marketing status"
                value={customer.emailMarketingConsent}
                onChange={(e) => {
                  void setConsent(customer.id, e.target.value as typeof customer.emailMarketingConsent)
                  toast('Consent updated')
                }}
                options={(Object.keys(CONSENT_LABELS) as (keyof typeof CONSENT_LABELS)[]).map((k) => ({ label: CONSENT_LABELS[k], value: k }))}
                disabled={!canEdit}
              />
            </CardSection>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold">Tags</h3>
              {canEdit && (
                <button
                  className="text-xs text-accent hover:underline"
                  onClick={() => {
                    setTagDraft(customer.tags)
                    setTagsOpen(true)
                  }}
                >
                  Edit
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {customer.tags.length === 0 && <p className="text-[13px] text-text-muted">No tags</p>}
              {customer.tags.map((t) => (
                <Badge key={t} tone="info">{t}</Badge>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold">Notes</h3>
              {canEdit && (
                <button className="text-xs text-accent hover:underline" onClick={openEdit}>
                  Edit
                </button>
              )}
            </div>
            <p className="mt-2 text-[13px] text-text-muted">
              {customer.note || <span>No notes yet.</span>}
            </p>
          </Card>

          <Card padding={false}>
            <CardHeader
              title={`Addresses (${customer.addresses.length})`}
              actions={
                canEdit && (
                  <Button size="sm" icon={<Plus size={12} />} onClick={() => setAddressOpen(true)}>
                    Add
                  </Button>
                )
              }
            />
            <ul className="divide-y divide-border">
              {customer.addresses.map((a, i) => (
                <li key={i} className="px-4 py-2.5 text-[13px]">
                  <div className="flex items-start justify-between gap-2">
                    <span>
                      {a.address1}{a.address2 && <>, {a.address2}</>}, {a.city}, {a.province} {a.zip}, {a.country}
                    </span>
                    {customer.defaultAddress === a ? (
                      <Badge tone="success">Default</Badge>
                    ) : (
                      canEdit && (
                        <button
                          className="shrink-0 text-xs text-accent hover:underline"
                          onClick={() => void setDefaultAddress(customer.id, i).then(() => toast('Default address updated'))}
                        >
                          Set default
                        </button>
                      )
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding={false}>
            <CardHeader title="Recent activity" />
            <ul className="divide-y divide-border">
              {customerOrders.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center justify-between px-4 py-2 text-[13px]">
                  <span>
                    Placed {o.name}
                    <span className="block text-xs text-text-muted">{formatRelative(o.createdAt)}</span>
                  </span>
                  <span className="font-medium">{formatMoney(o.total)}</span>
                </li>
              ))}
              {customerOrders.length === 0 && (
                <li className="px-4 py-4 text-center text-[13px] text-text-muted">No activity yet.</li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      {/* Edit drawer */}
      <Drawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit customer"
        footer={
          <>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!edit.firstName.trim() || !edit.email.trim()) {
                  toast('First name and email are required', { tone: 'critical' })
                  return
                }
                await updateCustomer(customer.id, {
                  firstName: edit.firstName.trim(),
                  lastName: edit.lastName.trim(),
                  email: edit.email.trim(),
                  phone: edit.phone.trim() || undefined,
                  note: edit.note.trim() || undefined,
                })
                toast('Customer updated')
                setEditOpen(false)
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" value={edit.firstName} onChange={(e) => setEdit({ ...edit, firstName: e.target.value })} />
            <Input label="Last name" value={edit.lastName} onChange={(e) => setEdit({ ...edit, lastName: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
          <Input label="Phone" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
          <Textarea label="Note" value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} rows={3} />
          <Toggle
            label="Tax exempt"
            helpText="Customer is exempt from taxes at checkout"
            checked={customer.taxExempt}
            onChange={(v) => void updateCustomer(customer.id, { taxExempt: v }).then(() => toast('Tax exemption updated'))}
          />
        </div>
      </Drawer>

      {/* Tags drawer */}
      <Drawer
        open={tagsOpen}
        onClose={() => setTagsOpen(false)}
        title="Customer tags"
        footer={
          <>
            <Button onClick={() => setTagsOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                await updateCustomer(customer.id, { tags: tagDraft })
                toast('Tags updated')
                setTagsOpen(false)
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <TagInput value={tagDraft} onChange={setTagDraft} suggestions={['vip', 'repeat', 'wholesale', 'newsletter', 'high-value', 'local']} />
      </Drawer>

      {/* Add address modal */}
      <Drawer
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        title="Add address"
        footer={
          <>
            <Button onClick={() => setAddressOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!addressForm.address1.trim()) {
                  toast('Street address is required', { tone: 'critical' })
                  return
                }
                await addAddress(customer.id, { ...addressForm, firstName: customer.firstName, lastName: customer.lastName })
                toast('Address added')
                setAddressOpen(false)
                setAddressForm({ firstName: '', lastName: '', address1: '', address2: '', city: '', province: '', country: 'United States', zip: '' })
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Street address" value={addressForm.address1} onChange={(e) => setAddressForm({ ...addressForm, address1: e.target.value })} />
          <Input label="Apartment, suite, etc." value={addressForm.address2} onChange={(e) => setAddressForm({ ...addressForm, address2: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
            <Input label="State / Province" value={addressForm.province} onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="ZIP / Postal code" value={addressForm.zip} onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })} />
            <Input label="Country" value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
