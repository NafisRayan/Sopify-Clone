# Admin API Parity Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Close every gap between the Shopify Admin GraphQL API's merchant-facing feature surface and the Northstar admin clone, for everything simulatable in a frontend-only app.

**Scope honesty:** The Admin API's 27 domains include pure backend infrastructure (Webhooks, Bulk operations, Billing, Privacy, Cart, Checkout branding/runtime). These are not admin screens and cannot exist in a browser-only demo — they are tracked as "intentionally out of scope" below. Everything else (merchant screens & workflows) is targeted for parity.

**Tech stack:** unchanged (React 18 + TS strict + Vite + Tailwind v4 + zustand persist + recharts + lucide).

---

## Gap analysis: Admin API domains → current state → action

| # | API domain | Current state | Action |
|---|---|---|---|
| 1 | Access (staff, permissions) | Staff CRUD, permission editor, simulate-as | **Add**: staff activity log; store-level permission display |
| 2 | Analytics | Sections, comparison, rank movement | **Add**: CSV report export; saved-report (preset) concept via URL |
| 3 | Apps | Installed + suggestions, toggle/uninstall | Keep (parity OK) |
| 4 | B2B (Companies) | ❌ missing | **Add module**: companies list/detail, locations, contacts, B2B price list flag |
| 5 | Billing (app subscriptions) | n/a merchant-side | Out of scope |
| 6 | Bulk operations | Backend infra | Out of scope (UX covered by bulk actions) |
| 7 | Cart | Storefront object | Out of scope |
| 8 | Checkout & accounts config | Settings/checkout | Keep; add customer-account "new accounts" toggle note (done) |
| 9 | Checkout branding | Storefront runtime | Out of scope (theme customizer simulates) |
| 10 | Common objects (Metafield, File, MediaImage) | Files ✓; **metafields ❌** | **Add**: metafield definitions (settings) + metafield editor on products & customers |
| 11 | Customers | List/detail/CRUD/tags/notes/consent | **Add**: Customer **Segments** (list, member preview); CSV export; merge-lite skip |
| 12 | Discounts & marketing | 4 discount types, campaigns | **Add**: discount combinations toggle; discount CSV export; marketing UTM report row |
| 13 | Inventory | Adjust/transfer/history/bulk | **Add**: dedicated **Transfers** list (draft/in_transit/received) with receive flow |
| 14 | Localizations | ❌ missing | **Add**: Languages settings (locale list, add/remove, default) |
| 15 | Metafields | ❌ missing | (see 10) |
| 16 | Metaobjects | ❌ missing | **Add lite**: Content → "Entries" (definition-lite key/value content entries) |
| 17 | Online store | Themes/nav/pages/blog/files/preferences | **Add**: URL **Redirects** manager; blog **comments moderation** |
| 18 | Orders | Full workflows, timeline | **Add**: **order edit** (add/remove items, recompute totals), **returns/exchanges** flow, **fraud/risk panel**, draft **send invoice** |
| 19 | Privacy | Webhook infra | Out of scope |
| 20 | Products & collections | Deep coverage | **Add**: **Gift cards** (product type + issued-cards list with balances); product alt-text editing in media manager |
| 21 | Retail (POS) | Channels, pickup rate | Keep (parity OK-lite) |
| 22 | Shipping & fulfillment | Flat rates, fulfillment flow | **Add**: shipping **zones/profiles** editor upgrade (regions → zones with rates per zone) |
| 23 | Shopify Markets | ❌ missing | **Add lite**: Markets settings (country list w/ price adjustment %, currency display) |
| 24 | Shopify Payments | Provider toggles | **Add**: **Payouts** page (balance, payout list, transactions) under Finances |
| 25 | Store properties (shop) | General settings | **Add**: plan card + store ID display |
| 26 | Timeline events | Order timeline | Keep (customer/product timelines exist) |
| 27 | Webhooks | Event delivery infra | Out of scope |

**New entities (types):** `Company`, `CompanyLocation`, `CompanyContact`, `CustomerSegment`, `InventoryTransfer`(+lines), `GiftCard`, `Payout`(+BalanceTransaction), `MetafieldDefinition`, `Metafield`(per-resource map), `UrlRedirect`, `StoreLocale`, `MarketCountry`, `StaffActivityEntry`, `ReturnRecord`, `OrderEditRecord`.

**Routes to add:** `/companies`, `/companies/:id`, `/customers/segments`, `/customers/segments/:id`, `/inventory/transfers`, `/inventory/transfers/:id`, `/gift-cards`, `/gift-cards/:id`, `/finances/payouts`, `/online-store/redirects`, `/content/entries`, `/settings/markets`, `/settings/languages`, `/settings/activity-log` (+ settings index & sidebar entries).

---

## Phases

### Phase A — Foundations
- [ ] `types`: add all new entities above.
- [ ] `lib/csv.ts`: `toCsv(rows, columns)` + `downloadCsv(filename)` helper; browser-only download.
- [ ] Seed generators: companies (4, with locations/contacts), segments (4 with query defs), transfers (6 in various states), gift cards (10 issued), payouts (8 + ~40 balance transactions), metafield definitions (6), redirects (8), locales (3), markets countries (5), staff activity entries (~25), metafield values on products/customers (subset).
- [ ] Store slices + service functions for each; wire `resetData`.
- [ ] Validators extended in `scripts/validate-seed.ts`.

### Phase B — Orders depth
- [ ] Order **edit**: modal flow to add items (variant picker) / change quantities before capture when unfulfilled; recalculates totals; timeline event `edit`.
- [ ] **Returns/exchanges**: "Return items" flow from order detail (choose items+qty, reason, restock, exchange-for variant optional) → creates ReturnRecord, updates payment/fulfillment status, restocks via inventoryService.
- [ ] **Fraud panel**: order detail card (risk level, signals) — seeded per order.
- [ ] Draft **send invoice**: marks draft `invoiceSent`, timeline event, toast.

### Phase C — New modules
- [ ] **Gift cards**: issue card modal (code, initial balance, customer), list w/ status (enabled/disabled/expired), detail w/ balance history, disable/enable.
- [ ] **B2B companies**: list w/ search, detail (locations, contacts, orders derived), assign price-list %, delete confirm.
- [ ] **Customer segments**: list, detail with live member preview (rule-based like smart collections), CSV export.
- [ ] **Inventory transfers**: list (status filter), create (variant lines + from/to), mark in-transit/receive (moves stock via inventoryService), detail w/ lines.
- [ ] **Payouts (Finances)**: balance card, payouts table, transaction list, per-payout detail drawer.
- [ ] Sidebar + routes for all; global search extended (companies, gift cards, segments, transfers).

### Phase D — Storefront & settings
- [ ] **Redirects**: list w/ add/edit/delete, from/to validation, search.
- [ ] **Markets**: countries table w/ price adjustment %, currency display toggle.
- [ ] **Languages**: locale list, add/remove, default locale.
- [ ] **Metafields**: definitions editor (settings) + metafield section on product/customer detail (key/type/value rows, add/remove).
- [ ] **Content entries** (metaobjects lite): list + editor with fields from definition.
- [ ] **Staff activity log**: entries seeded + appended on key actions (via services); settings page w/ filter.
- [ ] **Plan card**: Settings general — "Trial · 14 days left" style card + store ID.
- [ ] **CSV export**: Export buttons on orders/products/customers/discounts/segments/analytics tables (uses current filtered rows where available).
- [ ] **Discount combinations**: checkbox on discount editor; marketing UTM report row on marketing page.

### Phase E — QA & docs
- [ ] Route walk (all new routes), console clean; persistence checks; permissions gating on new destructive actions.
- [ ] `npm run build` green; seed validator green; README updated.

## Conventions
- Same patterns as existing code: services own mutations + business rules; store slices via zustand persist; DataTable for lists; Toast/Confirm on all mutations; URL-synced filters on list pages.
- All new destructive actions gated by `useCan()`; appended activity-log entries in services for audit trail.
