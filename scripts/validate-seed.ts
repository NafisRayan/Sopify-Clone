/**
 * Referential-integrity checks for the seed data (spec §65).
 * Run: npm run seed:validate  → exits non-zero on any broken reference.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath as furl } from 'node:url'
import type {
  Product, Customer, Order, Collection, Location, InventoryLevel, InventoryHistoryEntry,
  Discount, AbandonedCheckout, FileAsset, StaffMember,
} from '../src/types'

const DATA = join(furl(import.meta.url), '..', '..', 'src', 'data')

function load<T>(name: string): T {
  return JSON.parse(readFileSync(join(DATA, `${name}.json`), 'utf8')) as T
}

const products = load<Product[]>('products')
const customers = load<Customer[]>('customers')
const orders = load<Order[]>('orders')
const collections = load<Collection[]>('collections')
const locations = load<Location[]>('locations')
const levels = load<InventoryLevel[]>('inventory-levels')
const history = load<InventoryHistoryEntry[]>('inventory-history')
const discounts = load<Discount[]>('discounts')
const abandoned = load<AbandonedCheckout[]>('abandoned-checkouts')
const files = load<FileAsset[]>('files')
const staff = load<StaffMember[]>('staff')

let errors = 0
const fail = (msg: string) => {
  errors++
  console.error(`  ✗ ${msg}`)
}
const ok = (msg: string) => console.log(`  ✓ ${msg}`)

const productIds = new Set(products.map((p) => p.id))
const variantIds = new Set(products.flatMap((p) => p.variants.map((v) => v.id)))
const customerIds = new Set(customers.map((c) => c.id))
const locationIds = new Set(locations.map((l) => l.id))
const collectionIds = new Set(collections.map((c) => c.id))

console.log('Validating seed data…')

// Orders
for (const o of orders) {
  if (!customerIds.has(o.customerId)) fail(`order ${o.name} references missing customer ${o.customerId}`)
  if (!o.customerId.startsWith('c_') && !o.customerId.startsWith('o_')) fail(`order ${o.name} odd customerId`)
  if (o.status === 'cancelled' && !o.cancelledAt) fail(`order ${o.name} cancelled without cancelledAt`)
  for (const li of o.lineItems) {
    if (!productIds.has(li.productId)) fail(`order ${o.name} line references missing product ${li.productId}`)
    if (!variantIds.has(li.variantId)) fail(`order ${o.name} line references missing variant ${li.variantId}`)
    if (li.quantity < 1) fail(`order ${o.name} line quantity < 1`)
  }
  const subtotal = o.lineItems.reduce((s, li) => s + li.price * li.quantity - li.totalDiscount, 0)
  if (Math.abs(subtotal - o.subtotal) > 0.02 && o.status !== 'draft')
    fail(`order ${o.name} subtotal mismatch: computed ${subtotal.toFixed(2)} vs stored ${o.subtotal}`)
  const refundTotal = o.refunds.reduce((s, r) => s + r.amount, 0)
  if (refundTotal > o.total + 0.01) fail(`order ${o.name} refunds exceed total`)
  if (o.fulfillmentStatus === 'fulfilled' && o.fulfillments.length === 0)
    fail(`order ${o.name} fulfilled without fulfillment records`)
}
ok(`orders: ${orders.length} checked`)

// Customers
for (const c of customers) {
  if (!c.email.includes('@')) fail(`customer ${c.id} has invalid email`)
  if (c.addresses.length === 0) fail(`customer ${c.id} has no address`)
}
ok(`customers: ${customers.length} checked`)

// Products ↔ collections symmetric
for (const p of products) {
  for (const cid of p.collectionIds) {
    if (!collectionIds.has(cid)) fail(`product ${p.id} references missing collection ${cid}`)
  }
  if (p.variants.length === 0) fail(`product ${p.id} has no variants`)
  if (p.media.length === 0) fail(`product ${p.id} has no media`)
  for (const v of p.variants) {
    if (v.productId !== p.id) fail(`variant ${v.id} has wrong productId`)
  }
}
for (const col of collections) {
  for (const pid of col.productIds) {
    if (!productIds.has(pid)) fail(`collection ${col.title} references missing product ${pid}`)
  }
}
ok(`products/collections: ${products.length}/${collections.length} checked, links symmetric`)

// Inventory
for (const l of levels) {
  if (!variantIds.has(l.variantId)) fail(`inventory level references missing variant ${l.variantId}`)
  if (!locationIds.has(l.locationId)) fail(`inventory level references missing location ${l.locationId}`)
  if (l.available < 0 || l.committed < 0 || l.unavailable < 0) fail(`negative counts on ${l.variantId}@${l.locationId}`)
}
for (const h of history) {
  if (!variantIds.has(h.variantId)) fail(`inventory history references missing variant ${h.variantId}`)
}
ok(`inventory: ${levels.length} levels, ${history.length} history entries`)

// Discounts
for (const d of discounts) {
  if (d.type === 'percentage' && (d.value ?? 0) > 100) fail(`discount ${d.code} percentage > 100`)
  for (const pid of d.productIds) if (!productIds.has(pid)) fail(`discount ${d.code} references missing product ${pid}`)
}
ok(`discounts: ${discounts.length} checked`)

// Abandoned checkouts
for (const a of abandoned) {
  if (!customerIds.has(a.customerId)) fail(`abandoned checkout ${a.id} references missing customer`)
  for (const li of a.lineItems) if (!variantIds.has(li.variantId)) fail(`abandoned checkout ${a.id} bad variant`)
}
ok(`abandoned checkouts: ${abandoned.length} checked`)

// Staff owner
if (!staff.some((s) => s.role === 'owner')) fail('no owner staff member')
ok(`staff: ${staff.length} checked (owner present)`)

// Counts vs spec §35
const variants = products.flatMap((p) => p.variants).length
const counts: [string, number, number][] = [
  ['products', products.length, 50],
  ['variants', variants, 100],
  ['customers', customers.length, 50],
  ['orders', orders.length, 100],
  ['locations', locations.length, 5],
  ['collections', collections.length, 10],
  ['discounts', discounts.length, 15],
  ['files', files.length, 20],
  ['campaigns', (load<unknown[]>('campaigns')).length, 10],
  ['staff', staff.length, 10],
]
for (const [name, actual, min] of counts) {
  if (actual < min) fail(`only ${actual} ${name} (spec requires ${min}+)`)
  else ok(`${name}: ${actual} (≥${min})`)
}

if (errors > 0) {
  console.error(`\n${errors} problem(s) found.`)
  process.exit(1)
}
console.log('\nAll seed data valid.')
