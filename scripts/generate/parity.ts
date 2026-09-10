/**
 * Parity-expansion seed generator: B2B companies, segments, transfers, gift cards,
 * payouts/transactions (derived from real orders), metafields, redirects, locales,
 * markets, staff activity, returns, order edits, fraud signals, plan.
 * Run via scripts/generate/index.ts
 */
import { Rng } from '../../src/lib/rng'
import type { Product, Customer, Order, Location, StaffMember } from '../../src/types'
import type {
  Company, CustomerSegment, InventoryTransfer, GiftCard, Payout, BalanceTransaction,
  MetafieldDefinition, Metafield, MetafieldOwnerMap, UrlRedirect, StoreLocale,
  MarketCountry, StaffActivityEntry, ReturnRecord, OrderEditRecord, OrderRisk, StorePlan,
} from '../../src/types/parity'

const rng = new Rng(4242)
const iso = (d: Date) => d.toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000)
const round2 = (n: number) => Math.round(n * 100) / 100

export interface ParityInput {
  products: Product[]
  customers: Customer[]
  orders: Order[]
  locations: Location[]
  staff: StaffMember[]
}

export function generateParity(input: ParityInput) {
  const { products, customers, orders, locations, staff } = input
  const liveOrders = orders.filter((o) => !o.isDraft)
  const companyBuyers = customers.slice(0, 4)

  // ── B2B companies ────────────────────────────────────────────────────────
  const companyNames = ['Cascadia Outfitters', 'Meridian Retail Group', 'Homestead Living Co.', 'Trailpost Wholesale']
  const cities = [locations[0]!, locations[2]!, locations[3]!, locations[1]!]
  const companies: Company[] = companyNames.map((name, i) => {
    const buyer = companyBuyers[i]!
    const locCount = rng.int(1, 3)
    const locationRecords = Array.from({ length: locCount }, (_, li) => ({
      id: `cl_${i + 1}_${li + 1}`,
      name: li === 0 ? `${name} — Main` : `${name} — Store ${li + 1}`,
      phone: `(${rng.int(201, 989)}) 555-${String(rng.int(100, 9999)).padStart(4, '0')}`,
      address: { ...buyer.defaultAddress!, company: name },
      taxExempt: rng.chance(0.3),
    }))
    return {
      id: `company_${i + 1}`,
      name,
      externalId: `EXT-${1000 + i}`,
      status: 'active' as const,
      customerId: buyer.id,
      note: rng.chance(0.5) ? 'Net-30 payment terms agreed.' : undefined,
      locations: locationRecords,
      contacts: [
        { id: `cc_${i + 1}_1`, name: `${buyer.firstName} ${buyer.lastName}`, email: buyer.email, locationIds: locationRecords.map((l) => l.id), isPrimary: true },
        ...(rng.chance(0.6)
          ? [{
              id: `cc_${i + 1}_2`,
              name: `${rng.pick(['Jordan', 'Casey', 'Riley'])} ${rng.pick(['Ng', 'Porter', 'Ellis'])}`,
              email: `orders${i + 1}@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
              locationIds: [locationRecords[0]!.id],
              isPrimary: false,
            }]
          : []),
      ],
      priceListDiscountPercent: rng.pick([5, 10, 15]),
      createdAt: iso(daysAgo(rng.int(90, 500))),
    }
  })

  // ── Customer segments ────────────────────────────────────────────────────
  const segments: CustomerSegment[] = [
    { id: 'seg_1', name: 'VIPs', description: 'Customers tagged VIP or over $500 spent', filters: [{ column: 'total_spent', relation: 'gt', value: '500' }], createdAt: iso(daysAgo(120)) },
    { id: 'seg_2', name: 'Repeat buyers', description: 'More than one order', filters: [{ column: 'orders_count', relation: 'gt', value: '1' }], createdAt: iso(daysAgo(98)) },
    { id: 'seg_3', name: 'Newsletter subscribers', description: 'Subscribed to email marketing', filters: [{ column: 'email_state', relation: 'equals', value: 'subscribed' }], createdAt: iso(daysAgo(76)) },
    { id: 'seg_4', name: 'Local Portland', description: 'Based in Portland', filters: [{ column: 'city', relation: 'contains', value: 'Portland' }], createdAt: iso(daysAgo(40)) },
  ]

  // ── Inventory transfers ──────────────────────────────────────────────────
  const skus = products.flatMap((p) => p.variants.map((v) => ({ variant: v, product: p })))
  const fromLoc = locations[0]!
  const transfers: InventoryTransfer[] = Array.from({ length: 6 }, (_, i) => {
    const status = (['draft', 'in_transit', 'received'] as const)[i % 3]
    const toLoc = locations[1 + (i % 4)]!
    const lines = rng.sample(skus, rng.int(2, 4)).map(({ variant, product }) => {
      const qty = rng.int(5, 30)
      return {
        id: `itl_${i + 1}_${variant.id}`,
        variantId: variant.id,
        sku: variant.sku,
        title: product.title,
        variantTitle: variant.title === 'Default Title' ? '' : variant.title,
        quantity: qty,
        receivedQuantity: status === 'received' ? qty : 0,
      }
    })
    return {
      id: `tf_${i + 1}`,
      name: `TF-${1001 + i}`,
      status,
      fromLocationId: fromLoc.id,
      toLocationId: toLoc.id,
      lines,
      createdAt: iso(daysAgo(30 - i * 4)),
      sentAt: status === 'draft' ? undefined : iso(daysAgo(25 - i * 4)),
      receivedAt: status === 'received' ? iso(daysAgo(10 - (i % 3))) : undefined,
      note: i === 0 ? 'Restock before holiday promo.' : undefined,
    }
  })

  // ── Gift cards ───────────────────────────────────────────────────────────
  const giftCards: GiftCard[] = Array.from({ length: 10 }, (_, i) => {
    const initial = rng.pick([25, 50, 75, 100, 150])
    const used = rng.chance(0.5) ? round2(initial * rng.float(0.1, 0.9)) : 0
    const status = i === 9 ? ('expired' as const) : i === 8 ? ('disabled' as const) : ('enabled' as const)
    const issuedAt = iso(daysAgo(rng.int(5, 200)))
    const customer = rng.chance(0.7) ? rng.pick(customers) : undefined
    return {
      id: `gc_${i + 1}`,
      code: `NORTH-${rng.int(1000, 9999)}-${rng.int(1000, 9999)}-${rng.int(1000, 9999)}`,
      customerId: customer?.id,
      initialBalance: initial,
      balance: status === 'expired' ? 0 : round2(initial - used),
      currency: 'USD' as const,
      status,
      expiresAt: status === 'expired' ? iso(daysAgo(2)) : rng.chance(0.4) ? iso(daysAgo(-rng.int(90, 400))) : undefined,
      note: i === 0 ? 'Customer service goodwill card.' : undefined,
      createdAt: issuedAt,
      history: [
        { id: `gch_${i + 1}_1`, at: issuedAt, type: 'issued' as const, amount: initial, note: customer ? `Issued to ${customer.firstName} ${customer.lastName}` : 'Issued manually' },
        ...(used > 0 ? [{ id: `gch_${i + 1}_2`, at: iso(daysAgo(rng.int(1, 20))), type: 'used' as const, amount: -used, note: 'Applied at checkout' }] : []),
        ...(status === 'disabled' ? [{ id: `gch_${i + 1}_3`, at: iso(daysAgo(3)), type: 'disabled' as const, amount: 0, note: 'Disabled by staff' }] : []),
      ],
    }
  })

  // ── Payouts & balance transactions (derived from real orders) ───────────
  const transactions: BalanceTransaction[] = []
  for (const o of liveOrders) {
    if (o.paymentStatus === 'paid' || o.paymentStatus === 'partially_refunded') {
      const fee = round2(o.total * 0.029 + 0.3)
      transactions.push({
        id: `bt_c_${o.id}`, at: o.createdAt, type: 'charge',
        amount: round2(o.total - (o.discountCode?.amount ?? 0)), fee, net: round2(o.total - fee),
        orderId: o.id, description: `Charge for ${o.name}`,
      })
    }
    for (const r of o.refunds) {
      const fee = round2(r.amount * 0.029)
      transactions.push({
        id: `bt_r_${r.id}`, at: r.createdAt, type: 'refund',
        amount: -round2(r.amount), fee: -fee, net: -round2(r.amount - fee),
        orderId: o.id, description: `Refund for ${o.name} (${r.reason})`,
      })
    }
  }
  transactions.sort((a, b) => a.at.localeCompare(b.at))
  // weekly payouts, most recent still scheduled/in_transit
  const payouts: Payout[] = []
  const chunk = 7 * 86400_000
  let groupStart = transactions.length ? new Date(transactions[0]!.at).getTime() : Date.now()
  const end = transactions.length ? new Date(transactions[transactions.length - 1]!.at).getTime() : Date.now()
  let pi = 1
  for (let s = groupStart; s <= end + 1; s += chunk) {
    const e = s + chunk
    const group = transactions.filter((t) => {
      const at = new Date(t.at).getTime()
      return at >= s && at < e
    })
    if (group.length === 0) continue
    const amount = round2(group.reduce((sum, t) => sum + t.net, 0))
    const issuedAt = iso(new Date(e))
    const isLast = e > end
    const payout: Payout = {
      id: `po_${pi}`,
      status: isLast ? 'scheduled' : rng.chance(0.25) ? 'in_transit' : 'paid',
      amount,
      currency: 'USD',
      issuedAt,
      arrivedAt: isLast || amount < 0 ? undefined : iso(new Date(e + 2 * 86400_000)),
      bankAccount: '•••• 4821',
    }
    for (const t of group) t.payoutId = payout.id
    payouts.push(payout)
    pi++
  }

  // ── Metafields ───────────────────────────────────────────────────────────
  const metafieldDefinitions: MetafieldDefinition[] = [
    { id: 'mfdef_1', namespace: 'custom', key: 'care_instructions', name: 'Care instructions', type: 'multi_line_text', resourceType: 'product', description: 'Shown on the product page' },
    { id: 'mfdef_2', namespace: 'custom', key: 'material_origin', name: 'Material origin', type: 'single_line_text', resourceType: 'product' },
    { id: 'mfdef_3', namespace: 'custom', key: 'wash_temp', name: 'Wash temperature', type: 'integer', resourceType: 'product' },
    { id: 'mfdef_4', namespace: 'custom', key: 'loyalty_tier', name: 'Loyalty tier', type: 'single_line_text', resourceType: 'customer' },
    { id: 'mfdef_5', namespace: 'custom', key: 'referral_source', name: 'Referral source', type: 'single_line_text', resourceType: 'customer' },
    { id: 'mfdef_6', namespace: 'custom', key: 'packaging_note', name: 'Packaging note', type: 'single_line_text', resourceType: 'order' },
  ]
  const metafields: MetafieldOwnerMap = {}
  const mf = (defId: string, value: string, i: number): Metafield => ({ id: `mf_${defId}_${i}`, definitionId: defId, value })
  products.slice(0, 18).forEach((p, i) => {
    metafields[`product:${p.id}`] = [
      mf('mfdef_1', 'Machine wash cold. Tumble dry low.', i),
      mf('mfdef_2', rng.pick(['Portugal', 'Vietnam', 'USA', 'India']), i),
      mf('mfdef_3', String(rng.pick([30, 40, 60])), i),
    ]
  })
  customers.slice(0, 12).forEach((c, i) => {
    metafields[`customer:${c.id}`] = [
      mf('mfdef_4', rng.pick(['Bronze', 'Silver', 'Gold']), i),
      mf('mfdef_5', rng.pick(['Instagram', 'Google', 'Friend', 'Podcast']), i),
    ]
  })
  const sampleOrders = liveOrders.slice(0, 8)
  sampleOrders.forEach((o, i) => {
    metafields[`order:${o.id}`] = [mf('mfdef_6', rng.pick(['Gift wrap', 'No invoices in box', 'Fragile — this side up']), i)]
  })

  // ── Redirects, locales, markets ──────────────────────────────────────────
  const redirects: UrlRedirect[] = [
    { id: 'red_1', from: '/sale', to: '/collections/archive-sale', createdAt: iso(daysAgo(210)) },
    { id: 'red_2', from: '/about-us', to: '/pages/about', createdAt: iso(daysAgo(190)) },
    { id: 'red_3', from: '/shipping', to: '/pages/shipping-and-delivery', createdAt: iso(daysAgo(160)) },
    { id: 'red_4', from: '/collections/tshirts', to: '/collections/apparel', createdAt: iso(daysAgo(120)) },
    { id: 'red_5', from: '/blog', to: '/blogs/journal', createdAt: iso(daysAgo(90)) },
    { id: 'red_6', from: '/giftcards', to: '/products/soy-candle-set', createdAt: iso(daysAgo(60)) },
    { id: 'red_7', from: '/wholesale', to: '/pages/wholesale', createdAt: iso(daysAgo(30)) },
    { id: 'red_8', from: '/old-journal/how-to-wax-canvas', to: '/blogs/journal/how-to-wax-your-own-canvas', createdAt: iso(daysAgo(7)) },
  ]
  const locales: StoreLocale[] = [
    { code: 'en', name: 'English', isDefault: true, published: true },
    { code: 'fr', name: 'French', isDefault: false, published: true },
    { code: 'de', name: 'German', isDefault: false, published: false },
  ]
  const markets: MarketCountry[] = [
    { code: 'CA', name: 'Canada', currency: 'CAD', priceAdjustmentPercent: 0, enabled: true },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', priceAdjustmentPercent: 8, enabled: true },
    { code: 'DE', name: 'Germany', currency: 'EUR', priceAdjustmentPercent: 10, enabled: true },
    { code: 'FR', name: 'France', currency: 'EUR', priceAdjustmentPercent: 10, enabled: true },
    { code: 'AU', name: 'Australia', currency: 'AUD', priceAdjustmentPercent: 12, enabled: false },
  ]

  // ── Staff activity log ───────────────────────────────────────────────────
  const actor = () => rng.pick(staff.filter((s) => s.status === 'active'))
  const actions: [string, string][] = [
    ['Fulfilled order', 'order'], ['Refunded order', 'order'], ['Created product', 'product'],
    ['Updated product', 'product'], ['Adjusted inventory', 'inventory'], ['Created discount', 'discount'],
    ['Updated settings', 'settings'], ['Added customer', 'customer'], ['Issued gift card', 'gift_card'],
    ['Created collection', 'collection'], ['Published theme change', 'online_store'], ['Invited staff', 'staff'],
  ]
  const staffActivity: StaffActivityEntry[] = Array.from({ length: 26 }, (_, i) => {
    const [action, resource] = rng.pick(actions)
    const member = actor()
    const order = rng.pick(liveOrders)
    return {
      id: `act_${i + 1}`,
      at: iso(rng.dateWithin(30, true)),
      staffId: member.id,
      staffName: member.name,
      action,
      resource,
      resourceId: resource === 'order' ? order.id : undefined,
    }
  }).sort((a, b) => b.at.localeCompare(a.at))

  // ── Returns & order edits & risk ─────────────────────────────────────────
  const returnable = liveOrders.filter((o) => o.fulfillmentStatus === 'fulfilled').slice(0, 3)
  const returns: ReturnRecord[] = returnable.map((o, i) => {
    const line = o.lineItems[0]!
    return {
      id: `ret_${i + 1}`,
      orderId: o.id,
      status: i === 0 ? 'open' : 'returned',
      lines: [{ lineItemId: line.id, quantity: 1 }],
      reason: rng.pick(['Arrived damaged', 'Wrong size', 'Changed mind']),
      restock: true,
      refundAmount: round2(line.price),
      createdAt: iso(daysAgo(rng.int(1, 15))),
      closedAt: i === 0 ? undefined : iso(daysAgo(rng.int(1, 5))),
    }
  })
  const editable = liveOrders.filter((o) => o.status === 'open' && o.fulfillmentStatus === 'unfulfilled').slice(0, 2)
  const orderEdits: OrderEditRecord[] = editable.map((o, i) => {
    const v = rng.pick(skus)
    const qty = rng.int(1, 2)
    return {
      id: `oe_${i + 1}`,
      orderId: o.id,
      at: iso(rng.dateWithin(10, true)),
      author: 'Ava Chen',
      added: [{ variantId: v.variant.id, quantity: qty }],
      removed: [],
      deltaTotal: round2(v.variant.price * qty),
    }
  })
  const orderRisk: Record<string, OrderRisk> = {}
  for (const o of liveOrders) {
    const high = o.total > 400 && o.shippingAddress.country !== 'United States'
    orderRisk[o.id] = high
      ? { level: 'high', signals: ['Large order value', 'Shipping and billing countries differ'] }
      : rng.chance(0.12)
        ? { level: 'medium', signals: ['First-time customer', 'Multiple payment attempts'] }
        : { level: 'low', signals: [] }
  }

  const entries = [
    {
      id: 'mod_def_1',
      name: 'Testimonial',
      fields: [
        { key: 'author', label: 'Author', type: 'single_line_text' as const },
        { key: 'quote', label: 'Quote', type: 'multi_line_text' as const },
      ],
    },
    {
      id: 'mod_def_2',
      name: 'FAQ item',
      fields: [
        { key: 'question', label: 'Question', type: 'single_line_text' as const },
        { key: 'answer', label: 'Answer', type: 'multi_line_text' as const },
      ],
    },
  ]
  const entryItems = [
    { id: 'mod_e_1', definitionId: 'mod_def_1', fields: { author: 'Dana W.', quote: 'The canvas tote has survived two years of daily commuting and still looks great.' }, status: 'published' as const, updatedAt: iso(daysAgo(12)) },
    { id: 'mod_e_2', definitionId: 'mod_def_1', fields: { author: 'Marcus L.', quote: 'Best French press I have owned. Replacement carafe ordered in one click.' }, status: 'published' as const, updatedAt: iso(daysAgo(31)) },
    { id: 'mod_e_3', definitionId: 'mod_def_2', fields: { question: 'Do you ship internationally?', answer: 'Yes — tracked international shipping is $24.99, free over $250.' }, status: 'published' as const, updatedAt: iso(daysAgo(9)) },
    { id: 'mod_e_4', definitionId: 'mod_def_2', fields: { question: 'Are gift cards refundable?', answer: 'Gift cards are final sale and never expire (where prohibited by law).' }, status: 'draft' as const, updatedAt: iso(daysAgo(2)) },
  ]

  const plan: StorePlan = {
    name: 'Advanced',
    status: 'trial',
    trialDaysLeft: 14,
    storeId: 'NS-DEMO-4821',
  }

  return { companies, segments, transfers, giftCards, payouts, transactions, metafieldDefinitions, metafields, redirects, locales, markets, staffActivity, returns, orderEdits, orderRisk, plan, entries, entryItems }
}
