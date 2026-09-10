# Shopify Admin Frontend Clone — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality, frontend-only Shopify Admin–style merchant back office ("Northstar Goods") where every interaction works against local state + localStorage.

**Architecture:** React SPA with a persistent Zustand store hydrated from deterministic JSON seed data, wrapped by a simulated async service layer (`services/*`) so the UI never touches raw data. One reusable DataTable + filter system powers every list view. Feature modules under `src/features/*` own their routes, pages, and domain components.

**Tech Stack:** Vite + React 18 + TypeScript (strict), react-router-dom v6, Tailwind CSS, Zustand (+persist), lucide-react, recharts. No other runtime deps.

**Spec:** `prompt.md` (authoritative). Development strategy = spec §59 (18 phases), vertical slices per §70, no fake functionality (§62).

---

## Locked Architectural Decisions

### D1. Domain model (`src/types/index.ts`)

```ts
type ID = string;

interface Product {
  id: ID; title: string; descriptionHtml: string; vendor: string; productType: string;
  category?: string; status: 'active' | 'draft' | 'archived';
  tags: string[]; collections: ID[]; channels: ('online_store' | 'point_of_sale')[];
  options: ProductOption[];           // e.g. [{name:'Color', values:['Black','White']}]
  variants: ProductVariant[];         // 1..n; single "Default Title" variant when no options
  media: ProductMedia[];              // first = featured
  seo: { title: string; description: string; handle: string };
  weightGrams?: number; requiresShipping: boolean; trackQuantity: boolean;
  createdAt: string; updatedAt: string;
}
interface ProductOption { name: string; values: string[] }
interface ProductVariant {
  id: ID; productId: ID; title: string; sku: string; barcode?: string;
  price: number; compareAtPrice?: number; costPerItem?: number;
  optionValues: Record<string, string>;  // {Color:'Black'} — key = option name
  weightGrams?: number; imageId?: ID; available: boolean;
}
interface ProductMedia { id: ID; productId: ID; type: 'image'; src: string; alt: string }

interface Customer {
  id: ID; firstName: string; lastName: string; email: string; phone?: string;
  defaultAddress?: Address; addresses: Address[];
  tags: string[]; note?: string; emailMarketingConsent: 'subscribed'|'not_subscribed'|'pending';
  acceptsMarketing: boolean; taxExempt: boolean; createdAt: string; lastOrderId?: ID;
}
interface Address { firstName: string; lastName: string; company?: string; address1: string; address2?: string; city: string; province: string; country: string; zip: string; phone?: string }

interface Order {
  id: ID; name: string;                    // "#1048"
  customerId: ID; email: string; phone?: string;
  createdAt: string; cancelledAt?: string; closedAt?: string;
  paymentStatus: 'paid'|'pending'|'authorized'|'refunded'|'partially_refunded'|'voided'|'unpaid';
  fulfillmentStatus: 'fulfilled'|'unfulfilled'|'partial'|'returned';
  status: 'open'|'closed'|'cancelled';
  channel: 'Online Store'|'Point of Sale'|'Draft';
  lineItems: OrderLineItem[]; shippingAddress: Address; billingAddress: Address;
  shippingLines: { title: string; price: number }[];
  discountCodes: { code: string; amount: number }[];
  subtotal: number; shippingTotal: number; taxTotal: number; total: number;
  currency: 'USD';
  tags: string[]; note?: string;
  timeline: TimelineEvent[]; fulfillments: Fulfillment[]; refunds: Refund[];
  paymentGateway: string;
}
interface OrderLineItem { id: ID; productId: ID; variantId: ID; title: string; variantTitle: string; sku: string; quantity: number; price: number; totalDiscount: number; requiresShipping: boolean; fulfillableQuantity: number; imageSrc?: string }
interface TimelineEvent { id: ID; createdAt: string; type: 'created'|'payment'|'fulfillment'|'refund'|'cancel'|'note'|'tag'|'edit'; message: string; author: string }
interface Fulfillment { id: ID; createdAt: string; lineItemIds: ID[]; trackingNumber?: string; carrier?: string; locationId: ID; status: 'success' }
interface Refund { id: ID; createdAt: string; amount: number; reason: string; lineItemIds: ID[]; restock: boolean }

interface Collection { id: ID; title: string; descriptionHtml: string; imageSrc?: string; handle: string;
  type: 'manual'|'smart'; rules?: { column: 'tag'|'title'|'product_type'|'vendor'; relation: 'equals'|'contains'|'starts_with'; condition: string }[];
  productIds: ID[]; status: 'active'|'draft'; seoTitle?: string; seoDescription?: string; publishedAt?: string; createdAt: string }

interface Location { id: ID; name: string; address1: string; city: string; province: string; country: string; zip: string; phone?: string; active: boolean; createdAt: string }
interface InventoryLevel { variantId: ID; locationId: ID; available: number; committed: number; unavailable: number }
// onHand = available + committed + unavailable (computed)

interface Discount { id: ID; code: string; title: string; type: 'percentage'|'fixed_amount'|'free_shipping'|'bxgy';
  value?: number; bxgy?: { customerBuys: { quantity: number; amount?: number }; customerGets: { quantity: number; amount?: number } };
  method: 'code'|'automatic'; minPurchase?: number; customerEligibility: 'all'|'specific_segments'; segments?: string[];
  productEligibility: 'all'|'specific'; productIds?: ID[];
  usageLimit?: number; usedCount: number; startsAt: string; endsAt?: string; status: 'active'|'scheduled'|'expired'|'draft' }

interface Campaign { id: ID; name: string; channel: 'email'|'social'|'search'|'sms'; status: 'active'|'completed'|'scheduled'|'draft';
  sentAt?: string; audience: number; reached: number; sessions: number; orders: number; revenue: number; cost: number }

interface StaffMember { id: ID; name: string; email: string; role: 'owner'|'admin'|'staff'; status: 'active'|'invited'|'deactivated';
  lastActiveAt: string; permissions: PermissionSet }
type PermissionResource = 'products'|'orders'|'customers'|'analytics'|'settings';
type PermissionAction = string; // e.g. 'view','create','edit','delete','refund','cancel'
type PermissionSet = Record<PermissionResource, PermissionAction[]>;

interface StorePage { id: ID; title: string; contentHtml: string; handle: string; status: 'published'|'draft'; seoTitle?: string; seoDescription?: string; createdAt: string; updatedAt: string }
interface BlogPost { id: ID; title: string; author: string; contentHtml: string; imageSrc?: string; tags: string[];
  status: 'published'|'draft'|'scheduled'; publishedAt?: string; excerpt: string }
interface FileAsset { id: ID; name: string; type: 'image'|'document'|'video'; src: string; sizeKb: number;
  dimensions?: { width: number; height: number }; uploadedAt: string; alt?: string }
interface MenuItem { id: ID; title: string; url: string; children: MenuItem[] }
interface NavMenu { id: ID; title: string; handle: 'main-menu'|'footer'; items: MenuItem[] }
interface AppEntry { id: ID; name: string; description: string; iconBg: string; status: 'installed'|'disabled';
  permissions: string[]; category: string }

interface Settings { storeName: string; legalName: string; email: string; phone: string; address: Address;
  currency: string; timezone: string; unitSystem: 'metric'|'imperial'; weightUnit: 'kg'|'lb';
  orderPrefix: string; orderNumberFormat: string; checkout: { customerAccounts: 'disabled'|'optional'|'required'; emailReceipts: boolean; tipLine: boolean; abandonedRecovery: boolean };
  payments: { id: string; provider: string; enabled: boolean; testMode: boolean }[];
  shipping: { id: string; name: string; regions: string; rate: number; freeOver?: number }[];
  taxes: { chargeTaxOnShipping: boolean; includeTaxInPrices: boolean; taxRate: number };
  policies: { refund: string; privacy: string; terms: string; shipping: string };
  notifications: { orderConfirmation: boolean; shippingConfirmation: boolean; abandonedCheckout: boolean; customerWelcome: boolean };
}
```

### D2. Store & service layer (spec §37–39)

- `src/store/useStore.ts` — single Zustand store, shape: `{ products, customers, orders, collections, locations, inventoryLevels, discounts, campaigns, staff, pages, posts, files, menus, apps, settings, notifications }`.
- Persisted via `zustand/middleware` persist → localStorage key `northstar-admin-state-v1`. Versioned; `migrate` merges seed for new fields.
- **Seed-vs-modified:** on boot, if no stored state → store seed. "Reset demo data" button in Settings → clears storage + rehydrates (dev mechanism, spec §38).
- `src/services/*.ts` — async functions with 200–400ms simulated latency: `productsService`, `ordersService`, `customersService`, `inventoryService`, `collectionsService`, `discountsService`, `contentService`, `settingsService`, `staffService`. UI components call **only** services; services call store actions. Later swap internals for `fetch()` — signatures mirror REST (§68).
- Business rules live in services (§48): fulfill → decrement inventory + timeline event + status; refund → payment status + refund record + timeline; archive → status change; inventory adjust → levels + history log; auto-updating customer aggregates (`ordersCount`, `amountSpent`) derived via selectors, not duplicated state.

### D3. Design system (`src/components/ui/`) — Shopify-like tokens

- Tailwind config palette: `--background #f1f1f1` page bg, white surfaces, `border #e3e3e3`, text `#303030`, muted `#616161`, primary `#303030` (dark button like modern Shopify admin), accent `#005bd3` (links/focus), status colors: success `#1a7f37`-ish badge bg `#e3f1e1`, critical `#b4231f`/bg `#fcd9d5`, warning bg `#ffeb9c`-ish, info bg `#dff1f9`. Radius 8px cards, 6px controls. Font: Inter.
- Components: `Button` (primary/secondary/tertiary/destructive, sm/md), `Card`+`Card.Header/Section`, `Badge` (success/critical/warning/info/neutral + dot), `Input`, `Textarea`, `Select`, `Checkbox`, `DatePicker`(native), `Tabs`, `Modal`, `Drawer` (right, ESC + overlay lock), `Toast` system (`useToast()`), `Tooltip`(title attr acceptable), `Pagination`, `EmptyState`, `Skeleton`, `IndexFiltersBar` (search + filter chips + saved views look), `Page` (title row + actions + breadcrumbs), `LegacyCard`-style settings layout, `Banner` (info/warning/critical/success), `ResourceItem`.
- All follow §6: restrained, dense, no gradients/neon.

### D4. DataTable system (§29–31) — ONE implementation

`src/components/data-table/DataTable.tsx` generic over row type:
```ts
interface DataTableProps<T> {
  rows: T[]; columns: Column<T>[]; rowKey: (r:T)=>string;
  selectable?: boolean; bulkActions?: BulkAction<T>[]; rowActions?: (r:T)=>ReactNode;
  searchKeys?: (r:T)=>string; filters?: FilterDef<T>[]; initialSort?: SortState;
  pageSize?: number; loading?: boolean; emptyState?: ReactNode; sortSyncUrl?: string;
}
interface Column<T> { key: string; header: ReactNode; render: (r:T)=>ReactNode; sortValue?: (r:T)=>number|string; align?: 'left'|'right'; width?: string }
interface FilterDef<T> { key: string; label: string; type: 'select'|'multiselect'|'date-range'|'number-range'|'boolean'; options?: {label:string;value:string}[]; predicate: (r:T, value:any)=>boolean }
```
- URL state via `useSearchParams` hook `useTableUrlState` (search, filters, sort, page — §49/§56/§57).
- Bulk toolbar appears overlaid at top of table when selection > 0 (Shopify pattern). Select-all + indeterminate checkbox.

### D5. Routing (§40)

`/` redirects to `/` dashboard. Base routes at root (Vite preview handles SPA fallback): `/` (dashboard), `/orders`, `/orders/:id`, `/draft-orders`, `/products`, `/products/new`, `/products/:id`, `/products/:id/edit`, `/collections`, `/collections/:id`, `/inventory`, `/locations`, `/customers`, `/customers/:id`, `/discounts`, `/discounts/:id`, `/analytics`, `/marketing`, `/content/pages`, `/content/pages/:id`, `/content/blog`, `/content/blog/:id`, `/files`, `/online-store`, `/online-store/preferences`, `/online-store/menus/:handle`, `/apps`, `/settings`, `/settings/:section`, `/settings/users/:id`, `*` → NotFound. Feature pages lazy-loaded (`React.lazy`) per top-level section.

### D6. Shell (§5)

- Left sidebar (dark `#1a1a1a` like Shopify): store switcher popover, nav groups (Orders, Products ▸, Customers, Content ▸, Marketing ▸, Analytics, Discounts, Online Store ▸, Apps, Settings), collapsible, active-route highlight.
- Top of main area: global search bar (⌘K + `/` focus, §57), notifications bell w/ popover, help circle, account avatar menu.
- Mobile (<768px): sidebar → slide-over drawer via hamburger; tables switch to card/stacked rows via CSS; sticky bottom-safe action bars.
- Right-side drawer used for contextual edit (order fulfill, inventory adjust, quick add).

### D7. Seed data (§35, §47, §65)

Deterministic seeded PRNG (mulberry32). Generators in `scripts/` emitting JSON to `src/data/`: 56 products (8 families × variants: colors×sizes), 168+ variants, 60 customers with believable names/cities, 120 orders over last 90 days referencing real customers+variants with realistic distribution, 6 locations, 12 collections, 16 discounts, 24 files, 12 campaigns, 11 staff, pages/posts/menus/apps/settings. Analytics derived from orders where practical (`src/lib/analytics.ts` computes series client-side from order data so dashboard/analytics always agree with tables).

### D8. Conventions

- Formatting: `src/lib/format.ts` (`formatMoney(n, 'USD')`, `formatDate`, `formatDateTime`, `formatNumber`, relative time). Validation: `src/lib/validation.ts` (required, email, number>0). No magic strings — use `types/` constants. Feature folders own their components; shared only in `components/`. Toast on every successful mutation; confirm dialog on every destructive one (§33–34).

---

## Task Breakdown (vertical slices; each ends working + `npm run build` green)

### Task 1 — Scaffold & tooling
- [ ] `npm create vite@latest . -- --template react-ts`, install deps: `react-router-dom zustand lucide-react recharts`, dev: `tailwindcss @tailwindcss/vite`.
- [ ] Tailwind v4 via `@tailwindcss/vite` plugin + `@import "tailwindcss"` + `@theme` tokens in `src/index.css` (D3).
- [ ] Inter font, favicon placeholder, `paths` alias `@/` → `src/` in tsconfig + vite config.
- [ ] Verify: `npm run dev` serves; `npm run build` passes.

### Task 2 — Types, formatters, PRNG, validation
- [ ] `src/types/index.ts` (D1), `src/lib/format.ts`, `src/lib/rng.ts` (mulberry32 + helpers: pick, int, float, date), `src/lib/validation.ts`, `src/lib/id.ts` (nanoid-style).
- [ ] Verify: `tsc --noEmit` clean.

### Task 3 — Seed data generators → `src/data/*.json`
- [ ] Node scripts in `scripts/generate/*.ts` run via `tsx`: products/customers/orders/collections/locations/inventory/discounts/campaigns/staff/content/apps/settings/notifications. Cross-references valid (orders→customers/variants; inventory→variants×locations; collections→products).
- [ ] Data QA script: `scripts/validate-seed.ts` asserts every reference resolves (§65). Run it; fix until clean.

### Task 4 — Store + services + hooks
- [ ] `src/store/useStore.ts` zustand + persist (D2); `src/services/*` per D2; `src/hooks/useAsync.ts` (loading/error state wrapper used by pages), `useDebounce.ts`, `useEscape.ts`, `useMediaQuery.ts`.
- [ ] Simulated latency helper `delay(ms)` in `src/lib/delay.ts`.

### Task 5 — Design system components (D3)
- [ ] Button, Badge, Card, Input, Textarea, Select, Checkbox, Tabs, Modal, Drawer, Toast, Banner, EmptyState, Skeleton, Pagination, Page, Tooltip-lite. Every component: keyboard/ESC/focus/ARIA per §42/§45.
- [ ] Demo page route `/dev/ui` rendering all states (removed QA gate, kept for manual QA).

### Task 6 — DataTable + filters + URL state (D4)
- [ ] `DataTable<T>` + `useTableUrlState` + `IndexFiltersBar` + bulk toolbar. Sorting, pagination, select-all, bulk bar, loading skeleton rows, two empty-state modes (no data vs no results, §53).

### Task 7 — App shell + routing (D5/D6)
- [ ] `AppLayout` (sidebar/header/content outlet), StoreSwitcher, GlobalSearch (grouped results, keyboard nav), NotificationsPopover, AccountMenu, mobile drawer nav, breadcrumbs via route config, `<ScrollToTop/>`.
- [ ] All routes registered with lazy imports; NotFound + "coming soon" intentional placeholder template (§41).

### Task 8 — Dashboard
- [ ] KPI cards (total sales, net sales, orders, AOV, returning rate, conversion), recharts sales-over-time area chart + by-channel, top products, recent orders, inventory alerts, recommendations/tasks card. Date presets (§9) recompute all metrics via `lib/analytics.ts`.

### Task 9 — Products vertical slice (§11–14, §49)
- [ ] List (DataTable: image, title, status, inventory, type, vendor, channel, updated; filters status/inventory/type/vendor/collection/tag/channel; bulk: archive, delete(confirm), add/remove tags, set status, duplicate).
- [ ] Editor page `/products/:id/edit`: title, desc (contentEditable rich-lite toolbar), media manager (add URL/remove/reorder/featured), pricing card, inventory card, variants card (option editor + generated combos + per-variant inline edit drawer), organization (type/vendor/collections/tags), channels, SEO card with preview, status selector; actions Save/Save-duplicate/Delete(confirm)/Archive/Duplicate/Preview(dialog). `/products/new` = editor with draft product. URL-synced filters (§49).

### Task 10 — Orders vertical slice (§10, §50)
- [ ] Tabs All/Drafts/Abandoned; table columns per spec; filters payment/fulfillment/date-range/customer/channel/total-range/tags; bulk: mark paid, fulfill, archive, cancel(confirm), add tag. Draft order create (simple line-item picker) + convert to order.
- [ ] Detail: header w/ status badges + Unfulfilled/Fulfilled/… pill nav, customer card (link), contact+shipping+billing, line items w/ thumbs, totals, payment summary, timeline (note composer), tags editor, actions: Fulfill (drawer: select items + tracking + location → service updates), Refund (modal: amount/reason/restock → updates), Cancel (confirm), Edit (note/tags), Print (window.print of section), duplicate-as-draft.

### Task 11 — Customers (§18, §51)
- [ ] List + filters (location country, orders count range, spent range, consent, tags); bulk add tag/delete(confirm). Detail: profile card, editable fields drawer, addresses, orders list (linked), stats (total spent, AOV computed from orders), tags, notes, consent toggles, timeline of activity. New customer form `/customers/new` via drawer/page.

### Task 12 — Inventory + Locations (§16–17)
- [ ] `/inventory`: table product/variant/SKU per location columns (available/committed/unavailable/on hand), location selector, adjust drawer (+/− set with reason → history), transfer flow (from/to location, quantity → moves counts), bulk adjust. History panel per variant.
- [ ] `/locations`: cards/table, create/edit drawer, activate/deactivate(confirm if has inventory).

### Task 13 — Collections (§15)
- [ ] List w/ search + type filter. Detail/editor: title, desc, image, SEO, status; manual: product picker (searchable modal w/ add/remove); smart: rules builder (column/relation/condition + preview matched products via live predicate).

### Task 14 — Discounts (§19)
- [ ] List (status badges, method filter, search, bulk delete/deactivate). Create/edit wizard-lite: type select → dynamic fields (percent/fixed/free-ship/bxgy), method code vs automatic, minimum, eligibility (all/specific products via picker), usage limit, dates, status; validation (code unique, dates sane, value range). Deactivate/activate/delete(confirm).

### Task 15 — Analytics (§21, §52)
- [ ] Overview + Sales + Customers + Products tabs. All charts recompute from order data via `lib/analytics.ts` on date-range + comparison toggle (vs previous period overlay). Top products/regions tables.

### Task 16 — Marketing (§20)
- [ ] Overview KPIs (reach/sessions/orders/revenue/conversion/ROI from campaigns JSON), campaigns table (status filter, sort), campaign detail drawer w/ per-campaign metrics + activity feed.

### Task 17 — Content + Files (§22, §24)
- [ ] Pages list/editor (title, rich-lite content, handle auto-slug, SEO, status). Blog posts list/editor (author, image, tags, status, date). Files manager: grid/list toggle, search, type filter, multi-select bulk delete, rename, details drawer, upload-by-URL.

### Task 18 — Online Store + Apps (§23, §28)
- [ ] Themes: current theme card (preview image, Customize → simulated customizer drawer with color/typography selects that persist), theme library list w/ actions (publish/preview/rename/duplicate/delete confirm). Menus editor (`/online-store/menus/:handle`): tree with add/remove/rename/reorder(move up/down)/nest — persisted. Preferences: password page toggle, contact info form.
- [ ] Apps: installed list (icon, desc, status toggle, permissions, open→modal, uninstall confirm), app store suggestion grid (install → toast + adds to installed).

### Task 19 — Settings (§26–27)
- [ ] Settings index + sub-routes: General/Store details form, Payments (providers toggle, test mode), Checkout (customer accounts radio, toggles), Shipping (rates CRUD table), Taxes (form), Locations (link), Notifications (toggles), Policies (textareas render to preview), Users/Permissions (staff table + editor with per-resource permission checkboxes that actually gate UI: `usePermissions()` hook hides bulk delete etc.), Apps & sales channels link. Every form saves to store + toast. Reset demo data button.

### Task 20 — Global search polish + keyboard shortcuts (§8, §57)
- [ ] `/` or ⌘K opens command-palette style search over products/orders/customers/collections/discounts (fuzzy-ish contains), grouped results, ↑↓ enter navigation, recent searches (localStorage), no-results state.

### Task 21 — QA sweep (§63–65, §71)
- [ ] `npm run build` clean; walk every route; kill dead buttons; verify persistence across reload; verify responsive at 375/768/1280; check empty states by filtering to nonsense; confirm relations intact (validate-seed re-run + spot-check UI).
- [ ] Self-review checklist §71 answers documented in final summary.
