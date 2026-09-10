import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import {
  Badge, Button, Card, CardHeader, CardSection, DividedCard, EmptyState, Input, PageHeader,
  Radio, Select, useConfirm, useToast,
} from '@/components/ui'
import { DISCOUNT_STATUS_LABELS, DISCOUNT_TYPE_LABELS } from '@/lib/constants'
import { createDiscount, deleteDiscounts, discountStatusNow, updateDiscount } from '@/services/discountsService'
import { statusTone } from './DiscountsListPage'
import type { Discount, DiscountType } from '@/types'

function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function DiscountDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const existing = useStore((s) => s.discounts.find((d) => d.id === id))
  const isCreate = !id || id === 'new'

  const [form, setForm] = useState({
    code: '',
    title: '',
    type: 'percentage' as DiscountType,
    method: 'code' as 'code' | 'automatic',
    value: '10',
    buysQty: '1',
    buysAmount: '0',
    getsQty: '1',
    getsPercent: '50',
    minPurchase: '0',
    customerEligibility: 'all' as Discount['customerEligibility'],
    usageLimit: '',
    startsAt: toDatetimeLocal(new Date().toISOString()),
    endsAt: '',
    status: 'active' as Discount['status'],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) {
      setForm({
        code: existing.code,
        title: existing.title,
        type: existing.type,
        method: existing.method,
        value: existing.value !== undefined ? String(existing.value) : '',
        buysQty: String(existing.bxgy?.customerBuysQuantity ?? 1),
        buysAmount: String(existing.bxgy?.customerBuysAmount ?? 0),
        getsQty: String(existing.bxgy?.customerGetsQuantity ?? 1),
        getsPercent: String(existing.bxgy?.customerGetsDiscountPercent ?? 50),
        minPurchase: existing.minPurchase ? String(existing.minPurchase) : '0',
        customerEligibility: existing.customerEligibility,
        usageLimit: existing.usageLimit ? String(existing.usageLimit) : '',
        startsAt: toDatetimeLocal(existing.startsAt),
        endsAt: toDatetimeLocal(existing.endsAt),
        status: existing.status,
      })
    }
  }, [existing])

  const patch = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }))

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'A code or name is required'
    if (form.type === 'percentage') {
      const v = Number(form.value)
      if (Number.isNaN(v) || v <= 0 || v > 100) e.value = 'Enter a percentage between 1 and 100'
    }
    if (form.type === 'fixed_amount') {
      const v = Number(form.value)
      if (Number.isNaN(v) || v <= 0) e.value = 'Enter an amount greater than 0'
    }
    if (form.endsAt && form.startsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
      e.endsAt = 'End date must be after the start date'
    }
    if (form.usageLimit) {
      const n = Number(form.usageLimit)
      if (Number.isNaN(n) || n < 1) e.usageLimit = 'Usage limit must be at least 1'
    }
    return e
  }, [form])

  const summary = useMemo(() => {
    switch (form.type) {
      case 'percentage': return `${form.value}% off${Number(form.minPurchase) > 0 ? ` on orders over $${Number(form.minPurchase).toFixed(2)}` : ''}`
      case 'fixed_amount': return `$${Number(form.value || 0).toFixed(2)} off${Number(form.minPurchase) > 0 ? ` on orders over $${Number(form.minPurchase).toFixed(2)}` : ''}`
      case 'free_shipping': return `Free shipping${Number(form.minPurchase) > 0 ? ` on orders over $${Number(form.minPurchase).toFixed(2)}` : ''}`
      case 'bxgy': return `Buy ${form.buysQty} item${Number(form.buysQty) === 1 ? '' : 's'} (min $${Number(form.buysAmount || 0).toFixed(2)}), get ${form.getsQty} ${form.getsPercent}% off`
    }
  }, [form])

  const save = async () => {
    if (Object.values(errors).some(Boolean)) {
      toast('Fix the highlighted fields first', { tone: 'critical' })
      return
    }
    setSaving(true)
    try {
      const payload: Partial<Discount> = {
        code: form.code.trim().toUpperCase(),
        title: form.title.trim() || form.code.trim(),
        type: form.type,
        method: form.method,
        value: form.type === 'percentage' || form.type === 'fixed_amount' ? Number(form.value) : undefined,
        bxgy: form.type === 'bxgy'
          ? {
              customerBuysQuantity: Number(form.buysQty),
              customerBuysAmount: Number(form.buysAmount) || undefined,
              customerGetsQuantity: Number(form.getsQty),
              customerGetsDiscountPercent: Number(form.getsPercent),
            }
          : undefined,
        minPurchase: Number(form.minPurchase) > 0 ? Number(form.minPurchase) : undefined,
        customerEligibility: form.customerEligibility,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : new Date().toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
        status: form.status,
      }
      if (isCreate) {
        const created = await createDiscount(payload)
        toast('Discount created')
        navigate(`/discounts/${created.id}`, { replace: true })
      } else if (existing) {
        await updateDiscount(existing.id, payload)
        toast('Discount saved')
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', { tone: 'critical' })
    } finally {
      setSaving(false)
    }
  }

  if (!isCreate && !existing) {
    return (
      <div>
        <PageHeader title="Discount not found" backTo="/discounts" backLabel="Discounts" />
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState heading="Discount not found" message="It may have been deleted." primaryAction={{ label: 'Back to discounts', onClick: () => navigate('/discounts') }} />
        </div>
      </div>
    )
  }

  return (
    <div>
      {confirmElement}
      <PageHeader
        title={isCreate ? 'Create discount' : form.code}
        subtitle={
          !isCreate && existing ? (
            <span className="flex items-center gap-2">
              <Badge tone={statusTone(discountStatusNow(existing))} dot>
                {DISCOUNT_STATUS_LABELS[discountStatusNow(existing)]}
              </Badge>
              <span>· Used {existing.usedCount} times</span>
            </span>
          ) : (
            'Discount codes are entered at checkout; automatic discounts apply on their own'
          )
        }
        backTo="/discounts"
        backLabel="Discounts"
        primaryAction={
          <Button variant="primary" loading={saving} onClick={() => void save()}>
            {isCreate ? 'Create discount' : 'Save'}
          </Button>
        }
        secondaryActions={
          !isCreate && existing ? (
            <Button
              variant="destructive"
              icon={<Trash2 size={13} />}
              onClick={() =>
                confirm({
                  title: `Delete ${existing.code}?`,
                  body: 'Customers will no longer be able to use this discount. This cannot be undone.',
                  confirmLabel: 'Delete',
                  destructive: true,
                  onConfirm: async () => {
                    await deleteDiscounts([existing.id])
                    toast('Discount deleted', { tone: 'critical' })
                    navigate('/discounts')
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
          <DividedCard>
            <CardHeader title="Discount" />
            <CardSection>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label={form.method === 'automatic' ? 'Name' : 'Code'}
                    value={form.code}
                    error={errors.code}
                    onChange={(e) => patch({ code: e.target.value.toUpperCase() })}
                    placeholder={form.method === 'automatic' ? 'SUMMER_SALE' : 'SUMMER10'}
                    helpText={form.method === 'code' ? 'Customers enter this at checkout' : 'Shown as an automatic promotion'}
                  />
                  <Input label="Description (internal)" value={form.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Summer campaign" />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium">Type</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    {(Object.keys(DISCOUNT_TYPE_LABELS) as DiscountType[]).map((t) => (
                      <Radio key={t} name="dtype" label={DISCOUNT_TYPE_LABELS[t]} checked={form.type === t} onChange={() => patch({ type: t })} />
                    ))}
                  </div>
                </div>
                {(form.type === 'percentage' || form.type === 'fixed_amount') && (
                  <Input
                    label="Discount value"
                    type="number"
                    step="0.01"
                    min="0"
                    prefix={form.type === 'percentage' ? '%' : '$'}
                    value={form.value}
                    error={errors.value}
                    onChange={(e) => patch({ value: e.target.value })}
                    className="max-w-[200px]"
                  />
                )}
                {form.type === 'bxgy' && (
                  <div className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
                    <p className="text-xs font-semibold sm:col-span-2">Customer buys</p>
                    <Input label="Minimum quantity" type="number" min="1" value={form.buysQty} onChange={(e) => patch({ buysQty: e.target.value })} />
                    <Input label="Minimum purchase amount" type="number" step="0.01" min="0" prefix="$" value={form.buysAmount} onChange={(e) => patch({ buysAmount: e.target.value })} />
                    <p className="text-xs font-semibold sm:col-span-2">Customer gets</p>
                    <Input label="Quantity" type="number" min="1" value={form.getsQty} onChange={(e) => patch({ getsQty: e.target.value })} />
                    <Input label="Discount percent" type="number" min="1" max="100" value={form.getsPercent} onChange={(e) => patch({ getsPercent: e.target.value })} />
                  </div>
                )}
                <Input
                  label="Minimum purchase amount"
                  type="number"
                  step="0.01"
                  min="0"
                  prefix="$"
                  value={form.minPurchase}
                  onChange={(e) => patch({ minPurchase: e.target.value })}
                  helpText="0 means no minimum"
                  className="max-w-[220px]"
                />
              </div>
            </CardSection>
          </DividedCard>

          <DividedCard>
            <CardHeader title="Eligibility & limits" />
            <CardSection>
              <div className="space-y-3">
                <Select
                  label="Customer eligibility"
                  value={form.customerEligibility}
                  onChange={(e) => patch({ customerEligibility: e.target.value as Discount['customerEligibility'] })}
                  options={[
                    { label: 'All customers', value: 'all' },
                    { label: 'Email subscribers only', value: 'email_subscribers' },
                  ]}
                  className="max-w-xs"
                />
                <Input
                  label="Usage limit (total)"
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  error={errors.usageLimit}
                  onChange={(e) => patch({ usageLimit: e.target.value })}
                  placeholder="Unlimited"
                  className="max-w-[220px]"
                />
              </div>
            </CardSection>
          </DividedCard>

          <DividedCard>
            <CardHeader title="Active dates" />
            <CardSection>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Start date" type="datetime-local" value={form.startsAt} onChange={(e) => patch({ startsAt: e.target.value })} />
                <Input label="End date" type="datetime-local" value={form.endsAt} error={errors.endsAt} onChange={(e) => patch({ endsAt: e.target.value })} helpText="Leave empty for no end" />
              </div>
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium">Status</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  <Radio name="dstatus" label="Active" checked={form.status === 'active'} onChange={() => patch({ status: 'active' })} />
                  <Radio name="dstatus" label="Draft (inactive)" checked={form.status === 'draft'} onChange={() => patch({ status: 'draft' })} />
                </div>
              </div>
            </CardSection>
          </DividedCard>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-[13px] font-semibold">Summary</h3>
            <p className="mt-2 rounded-lg bg-[#fafafa] p-3 text-[13px]">
              <span className="font-semibold">{form.code || 'CODE'}</span> — {summary}
              <span className="mt-1 block text-xs text-text-muted">
                {form.method === 'automatic' ? 'Applies automatically at checkout' : 'Customers enter this code at checkout'}
              </span>
            </p>
            <ul className="mt-3 space-y-1 text-xs text-text-muted">
              <li>Starts: {form.startsAt ? new Date(form.startsAt).toLocaleString() : 'immediately'}</li>
              <li>Ends: {form.endsAt ? new Date(form.endsAt).toLocaleString() : 'never'}</li>
              <li>Limit: {form.usageLimit || 'unlimited uses'}</li>
            </ul>
          </Card>
          {existing && (
            <Card>
              <h3 className="text-[13px] font-semibold">Performance</h3>
              <p className="mt-2 text-[13px] text-text-muted">
                Used <span className="font-medium text-text">{existing.usedCount}</span> time{existing.usedCount === 1 ? '' : 's'}
                {existing.usageLimit ? ` of ${existing.usageLimit}` : ''}.
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1f1f1]">
                <div
                  className="h-full rounded-full bg-[#303030]"
                  style={{ width: existing.usageLimit ? `${Math.min(100, (existing.usedCount / existing.usageLimit) * 100)}%` : existing.usedCount > 0 ? '12%' : '0%' }}
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
