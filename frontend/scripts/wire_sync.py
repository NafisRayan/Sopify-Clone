#!/usr/bin/env python3
"""One-shot: add server sync calls to frontend services."""

def patch(path, pairs, import_line=None):
    s = open(path, encoding='utf-8').read()
    if import_line and import_line not in s:
        lines = s.split('\n')
        last = max(i for i, l in enumerate(lines) if l.startswith('import '))
        lines.insert(last + 1, import_line)
        s = '\n'.join(lines)
    misses = []
    for old, new in pairs:
        if old not in s:
            misses.append(old[:55].replace('\n', '\\n'))
            continue
        s = s.replace(old, new, 1)
    open(path, 'w', encoding='utf-8', newline='\n').write(s)
    print(('ok  ' if not misses else 'PART ') + path.split('/')[-1], misses if misses else '')

patch('src/services/customersService.ts', [
 ("import { delay } from '@/lib/delay'", "import { delay } from '@/lib/delay'\nimport { syncMutation } from './api'"),
 ("  store.addCustomer(customer)\n  return customer",
  "  store.addCustomer(customer)\n  syncMutation(`mutation { customerCreate(customer: { firstName: ${JSON.stringify(customer.firstName)}, lastName: ${JSON.stringify(customer.lastName)}, email: ${JSON.stringify(customer.email)}, phone: ${JSON.stringify(customer.phone ?? null)}, note: ${JSON.stringify(customer.note ?? null)}, tags: ${JSON.stringify(customer.tags)} }) { userErrors { message } } }`)\n  return customer"),
 ("""export async function updateCustomer(id: string, patch: Partial<Customer>): Promise<void> {
  await delay(300)
  getStore().patchCustomer(id, patch)
}""",
  """export async function updateCustomer(id: string, patch: Partial<Customer>): Promise<void> {
  await delay(300)
  getStore().patchCustomer(id, patch)
  const { addresses: _a, defaultAddress: _d, ...input } = patch as any
  syncMutation(`mutation { customerUpdate(id: ${JSON.stringify(id)}, customer: ${JSON.stringify(input)}) { userErrors { message } } }`)
}"""),
 ("export async function deleteCustomers(ids: string[]): Promise<void> {\n  await delay(350)\n  getStore().removeCustomers(ids)\n}",
  "export async function deleteCustomers(ids: string[]): Promise<void> {\n  await delay(350)\n  getStore().removeCustomers(ids)\n  syncMutation(`mutation { customerDelete(ids: ${JSON.stringify(ids)}) { userErrors { message } } }`)\n}"),
], "import { syncMutation } from './api'")

patch('src/services/inventoryService.ts', [
 ("import { CURRENT_USER } from '@/lib/constants'", "import { CURRENT_USER } from '@/lib/constants'\nimport { syncMutation } from './api'"),
 ("  store.upsertInventoryLevel(updated)\n  store.addInventoryHistory([recordHistory(updated, change, newAvailable, reason)])\n}",
  "  store.upsertInventoryLevel(updated)\n  store.addInventoryHistory([recordHistory(updated, change, newAvailable, reason)])\n  syncMutation(`mutation { inventoryAdjust(input: { variantId: ${JSON.stringify(variantId)}, locationId: ${JSON.stringify(locationId)}, availableDelta: ${change}, reason: ${JSON.stringify(reason)} }) { userErrors { message } } }`)\n}"),
], "import { syncMutation } from './api'")

patch('src/services/discountsService.ts', [
 ("import { uid } from '@/lib/id'", "import { uid } from '@/lib/id'\nimport { syncMutation } from './api'"),
 ("  store.addDiscount(discount)\n  return discount",
  "  store.addDiscount(discount)\n  syncMutation(`mutation { discountCreate(discount: ${JSON.stringify({ code: discount.code, title: discount.title, type: discount.type, method: discount.method, value: discount.value, minPurchase: discount.minPurchase, startsAt: discount.startsAt, endsAt: discount.endsAt, status: discount.status })}) { userErrors { message } } }`)\n  return discount"),
 ("  store.patchDiscount(id, patch)\n}",
  "  store.patchDiscount(id, patch)\n  const { combinations, ...rest } = patch as any\n  syncMutation(`mutation { discountUpdate(id: ${JSON.stringify(id)}, discount: ${JSON.stringify({ ...rest, combinations })}) { userErrors { message } } }`)\n}"),
 ("export async function deleteDiscounts(ids: string[]): Promise<void> {\n  await delay(300)\n  getStore().removeDiscounts(ids)\n}",
  "export async function deleteDiscounts(ids: string[]): Promise<void> {\n  await delay(300)\n  getStore().removeDiscounts(ids)\n  syncMutation(`mutation { discountDelete(ids: ${JSON.stringify(ids)}) { userErrors { message } } }`)\n}"),
], "import { syncMutation } from './api'")

patch('src/services/collectionsService.ts', [
 ("import { delay } from '@/lib/delay'", "import { delay } from '@/lib/delay'\nimport { syncMutation } from './api'"),
 ("  store.addCollection(collection)\n  // maintain product → collection links",
  "  store.addCollection(collection)\n  syncMutation(`mutation { collectionCreate(collection: ${JSON.stringify({ title: collection.title, descriptionHtml: collection.descriptionHtml, imageSrc: collection.imageSrc, handle: collection.handle, type: collection.type, rules: collection.rules, rulesMatch: collection.rulesMatch, productIds: collection.productIds, status: collection.status })}) { userErrors { message } } }`)\n  // maintain product → collection links"),
 ("  store.patchCollection(id, next)\n  // reconcile product side",
  "  store.patchCollection(id, next)\n  syncMutation(`mutation { collectionUpdate(id: ${JSON.stringify(id)}, collection: ${JSON.stringify({ title: next.title, descriptionHtml: next.descriptionHtml, type: next.type, rules: next.rules, rulesMatch: next.rulesMatch, productIds: next.productIds, status: next.status })}) { userErrors { message } } }`)\n  // reconcile product side"),
 ("  store.removeCollections(ids)\n}",
  "  store.removeCollections(ids)\n  syncMutation(`mutation { collectionDelete(ids: ${JSON.stringify(ids)}) { userErrors { message } } }`)\n}"),
], "import { syncMutation } from './api'")

patch('src/services/settingsService.ts', [
 ("import { uid } from '@/lib/id'", "import { uid } from '@/lib/id'\nimport { syncMutation } from './api'"),
 ("export async function updateStoreSettings(patch: Partial<StoreSettings>): Promise<void> {\n  await delay(350)\n  getStore().updateSettings(patch)\n}",
  "export async function updateStoreSettings(patch: Partial<StoreSettings>): Promise<void> {\n  await delay(350)\n  getStore().updateSettings(patch)\n  const current = getStore().settings\n  syncMutation(`mutation { settingsUpdate(value: ${JSON.stringify({ ...current, ...patch })}) { storeName } }`)\n}"),
 ("export async function toggleTask(id: string): Promise<void> {\n  getStore().toggleTask(id)\n}",
  "export async function toggleTask(id: string): Promise<void> {\n  getStore().toggleTask(id)\n  syncMutation(`mutation { taskToggle(id: ${JSON.stringify(id)}) { storeName } }`)\n}"),
], "import { syncMutation } from './api'")

patch('src/services/orderEditService.ts', [
 ("import { uid } from '@/lib/id'", "import { uid } from '@/lib/id'\nimport { syncMutation } from './api'"),
 ("  store.patchOrder(orderId, { lineItems, subtotal, taxTotal, total })",
  "  store.patchOrder(orderId, { lineItems, subtotal, taxTotal, total })\n  syncMutation(`mutation { orderEdit(id: ${JSON.stringify(orderId)}, added: ${JSON.stringify(input.added)}, removed: ${JSON.stringify(input.removed)}) { userErrors { message } } }`)"),
 ("  store.upsertReturn(record)\n  addTimeline(",
  "  store.upsertReturn(record)\n  syncMutation(`mutation { returnCreate(orderId: ${JSON.stringify(input.orderId)}, lines: ${JSON.stringify(input.lines)}, reason: ${JSON.stringify(input.reason)}, restock: ${input.restock}, refundAmount: ${input.refundAmount}) { userErrors { message } } }`)\n  addTimeline("),
 ("  store.upsertReturn({ ...ret, status: 'returned', closedAt: new Date().toISOString() })",
  "  store.upsertReturn({ ...ret, status: 'returned', closedAt: new Date().toISOString() })\n  syncMutation(`mutation { returnClose(id: ${JSON.stringify(id)}, markRefunded: ${markRefunded}) { userErrors { message } } }`)"),
], "import { syncMutation } from './api'")

patch('src/services/parityService.ts', [
 ("import { uid } from '@/lib/id'", "import { uid } from '@/lib/id'\nimport { syncMutation } from './api'"),
 ("  store.upsertCompany(company)\n  logActivity('Created company', 'company', company.id)",
  "  store.upsertCompany(company)\n  syncMutation(`mutation { companyCreate(company: ${JSON.stringify({ name: company.name, customerId: company.customerId, locationName: input.locationName, address: input.address, priceListDiscountPercent: input.priceListDiscountPercent })}) { userErrors { message } } }`)\n  logActivity('Created company', 'company', company.id)"),
 ("  store.upsertGiftCard(card)\n  logActivity('Issued gift card', 'gift_card', card.id)",
  "  store.upsertGiftCard(card)\n  syncMutation(`mutation { giftCardCreate(input: ${JSON.stringify({ customerId: input.customerId, initialBalance: input.initialBalance, note: input.note, expiresAt: input.expiresAt })}) { userErrors { message } } }`)\n  logActivity('Issued gift card', 'gift_card', card.id)"),
 ("  store.upsertTransfer(transfer)\n  logActivity('Created transfer', 'transfer', transfer.id)",
  "  store.upsertTransfer(transfer)\n  syncMutation(`mutation { inventoryTransferCreate(input: ${JSON.stringify({ fromLocationId: input.fromLocationId, toLocationId: input.toLocationId, note: input.note, lines: input.lines })}) { userErrors { message } } }`)\n  logActivity('Created transfer', 'transfer', transfer.id)"),
 ("  store.upsertTransfer({ ...t, status: 'in_transit', sentAt: new Date().toISOString() })",
  "  store.upsertTransfer({ ...t, status: 'in_transit', sentAt: new Date().toISOString() })\n  syncMutation(`mutation { inventoryTransferSend(id: ${JSON.stringify(transferId)}) { userErrors { message } } }`)"),
 ("    lines: t.lines.map((l) => ({ ...l, receivedQuantity: l.quantity })),\n  })",
  "    lines: t.lines.map((l) => ({ ...l, receivedQuantity: l.quantity })),\n  })\n  syncMutation(`mutation { inventoryTransferReceive(id: ${JSON.stringify(transferId)}) { userErrors { message } } }`)"),
], "import { syncMutation } from './api'")

patch('src/services/marketingService.ts', [
 ("import { uid } from '@/lib/id'", "import { uid } from '@/lib/id'\nimport { syncMutation } from './api'"),
 ("  getStore().addCampaign(campaign)\n  return campaign",
  "  getStore().addCampaign(campaign)\n  syncMutation(`mutation { campaignCreate(campaign: ${JSON.stringify({ name: input.name, channel: input.channel, audience: input.audience, cost: input.cost })}) { userErrors { message } } }`)\n  return campaign"),
], "import { syncMutation } from './api'")

print('all service sync calls wired')
