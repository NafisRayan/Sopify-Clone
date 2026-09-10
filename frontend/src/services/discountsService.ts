import { getStore } from '@/store/useStore'
import { uid } from '@/lib/id'
import { delay } from '@/lib/delay'
import type { Discount, DiscountStatus } from '@/types'

export function discountStatusNow(d: Discount): DiscountStatus {
  if (d.status === 'draft') return 'draft'
  const now = Date.now()
  const start = new Date(d.startsAt).getTime()
  const end = d.endsAt ? new Date(d.endsAt).getTime() : Infinity
  if (now < start) return 'scheduled'
  if (now > end) return 'expired'
  return 'active'
}

export async function createDiscount(input: Partial<Discount>): Promise<Discount> {
  await delay(350)
  const store = getStore()
  const code = (input.code ?? '').trim().toUpperCase()
  if (!code) throw new Error('Give the discount a code or name')
  if (store.discounts.some((d) => d.code.toUpperCase() === code)) {
    throw new Error('A discount with this code already exists')
  }
  if (input.type === 'percentage' && (input.value ?? 0) > 100) {
    throw new Error('Percentage cannot exceed 100')
  }
  const discount: Discount = {
    id: uid('disc'),
    code,
    title: input.title ?? code,
    type: input.type ?? 'percentage',
    method: input.method ?? 'code',
    value: input.value,
    bxgy: input.bxgy,
    minPurchase: input.minPurchase,
    customerEligibility: input.customerEligibility ?? 'all',
    productEligibility: input.productEligibility ?? 'all',
    productIds: input.productIds ?? [],
    usageLimit: input.usageLimit,
    usedCount: 0,
    startsAt: input.startsAt ?? new Date().toISOString(),
    endsAt: input.endsAt,
    status: input.status ?? 'active',
  }
  store.addDiscount(discount)
  return discount
}

export async function updateDiscount(id: string, patch: Partial<Discount>): Promise<void> {
  await delay(300)
  const store = getStore()
  if (patch.code) {
    const code = patch.code.trim().toUpperCase()
    if (store.discounts.some((d) => d.id !== id && d.code.toUpperCase() === code)) {
      throw new Error('A discount with this code already exists')
    }
    patch.code = code
  }
  store.patchDiscount(id, patch)
}

export async function deleteDiscounts(ids: string[]): Promise<void> {
  await delay(300)
  getStore().removeDiscounts(ids)
}

export async function setDiscountsStatus(ids: string[], status: DiscountStatus): Promise<void> {
  await delay(250)
  const store = getStore()
  for (const id of ids) store.patchDiscount(id, { status })
}
