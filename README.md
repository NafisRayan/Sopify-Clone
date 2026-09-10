# Northstar Goods — Shopify-style Admin (Frontend Clone)

A production-quality, **frontend-only** ecommerce back office inspired by the Shopify Admin.
Everything runs in the browser against JSON seed data + localStorage — no backend, no database.

![Stack](https://img.shields.io/badge/React%2018-TypeScript%20strict-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Tailwind](https://img.shields.io/badge/Tailwind%20v4-CSS--first-38bdf8)

## Run it

```bash
npm install
npm run dev        # → http://localhost:5173
```

Other scripts:

```bash
npm run build          # typecheck + production build
npm run preview        # serve the production build
npm run seed:generate  # regenerate demo data (src/data/*.json + public/images)
npm run seed:validate  # referential-integrity checks on the seed data
```

## What's inside

- **App shell** — dark sidebar with store switcher, expandable nav groups, live badges; global
  search palette (`/` or `⌘K`) across products/orders/customers/collections/discounts with
  keyboard navigation; notifications popover; account menu with **permission simulation**
  (act as a staff member and watch destructive actions disappear); responsive mobile drawer nav.
- **Dashboard** — KPIs (total/net sales, orders, AOV, returning rate) with previous-period deltas,
  sales chart, channel breakdown, top products, recent orders, inventory alerts, setup tasks.
  All recompute from date presets (today → this year + custom range, synced to the URL).
- **Orders** — list with tabs + 7 filters + bulk fulfill/pay/archive/cancel/tag; detail page with
  fulfill drawer (per-item, location, tracking), partial refunds with restock, cancellation that
  releases reserved stock, timeline with notes, tags, print. Draft orders and abandoned checkouts
  with recovery flows.
- **Products** — dense list with URL-synced filters (status/inventory/vendor/type/collection/tag/
  channel) and bulk ops; full editor (rich-lite description, media manager with reorder/featured,
  pricing + margin, options → variant generation preserving existing data, per-variant inventory
  drawers, organization, channels, SEO preview); product detail with per-location inventory and
  related orders.
- **Collections** (manual picker + smart rules with live preview), **Inventory** (adjust/transfer/
  history/bulk across locations), **Locations**, **Customers** (derived stats, addresses, consent,
  tags, notes), **Discounts** (all 4 types, codes vs automatic, validation), **Analytics**
  (sections + previous-period comparison + rank movement), **Marketing** (campaign KPIs,
  launch/complete), **Content** (pages, blog, files manager), **Online Store** (theme library +
  customizer, nested menu editor, preferences), **Apps**, **Settings** (store details, payments,
  checkout, shipping rates, taxes, notifications, policies, staff permission editor).

## Architecture

```
src/
  app/         layout (sidebar/header/global search) + router (lazy routes)
  components/  ui/ (design system) + data-table/ (ONE reusable table: URL-synced
               search/filter/sort/page, selection, bulk bar, mobile cards)
  features/    domain modules (dashboard, orders, products, …) — pages own their UI
  services/    simulated async API (the ONLY way UI mutates data; swap for fetch later)
  store/       zustand store persisted to localStorage + derived selectors
  data/        generated seed JSON (deterministic; see scripts/generate)
  lib/         formatters, validation, analytics, permissions, search
  types/       domain model
scripts/       seed generators + integrity validator
```

**Business rules are simulated for real**: fulfilling decrements committed stock and closes the
order; refunds update payment status and optionally restock; cancelling releases reserved
inventory; collection membership is reconciled both ways; customer stats are derived from orders
so they can never drift. All changes persist to localStorage; *Settings → General → Reset demo
data* restores the seed.

Demo data: 53 products · 185 variants · 62 customers · 130 orders · 12 collections · 16 discounts ·
5 locations · 12 campaigns · 11 staff — all cross-referenced and validated by `npm run seed:validate`.
