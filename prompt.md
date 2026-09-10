# SHOPIFY ADMIN FRONTEND CLONE

## MASTER AI CODING AGENT SUPER PROMPT

You are a senior product engineer, frontend architect, UX engineer, and QA engineer.

Your task is to build a production-quality frontend-only ecommerce back office inspired by and closely matching the current Shopify Admin experience.

The application must feel like a real Shopify merchant administration system, not a generic dashboard.

IMPORTANT:

* This is a FRONTEND-ONLY implementation for now.
* There is NO real backend.
* There is NO real database.
* There is NO real Shopify API.
* ALL data must come from local JSON/demo data.
* ALL CRUD operations must work in the browser by mutating application state and/or localStorage.
* The architecture must make replacing JSON/localStorage with a real API later straightforward.
* Do not build fake non-functional UI.
* Buttons, forms, filters, menus, tabs, drawers, modals, tables, search, sorting, pagination, bulk actions and workflows must actually work.

Use Shopify's publicly available Admin documentation and developer documentation as the conceptual reference for information architecture, terminology, workflows, entities, relationships and merchant-facing functionality.

Do NOT copy Shopify proprietary source code, logos, illustrations, copyrighted assets or internal implementation.

Build an original implementation that closely reproduces the Shopify Admin experience.

---

# 1. PRIMARY OBJECTIVE

Create a complete Shopify-style merchant back office.

The merchant should be able to:

* View dashboard metrics
* Manage products
* Manage product variants
* Manage collections
* Manage inventory
* Manage locations
* Manage orders
* View and modify order state
* Manage customers
* Manage discounts
* Manage marketing
* View analytics
* Manage content
* Manage online-store navigation
* Manage files
* Manage staff/users
* Manage store settings
* Search globally
* Filter data
* Sort data
* Perform bulk actions
* Create/edit/delete entities
* View detailed entity pages
* Navigate between related entities
* Use contextual actions
* See notifications/toasts
* Use confirmation dialogs
* Use empty states
* Use loading states
* Use error states
* Use responsive layouts

The result should feel like an actual ecommerce operating system.

---

# 2. CORE DESIGN PRINCIPLE

Do NOT think:

"Build a dashboard."

Think:

"Build the operating system that a merchant uses to run an ecommerce business."

Every entity should have:

1. List view
2. Search
3. Filters
4. Sorting
5. Pagination
6. Bulk selection
7. Bulk actions
8. Create flow
9. Edit flow
10. Detail view
11. Related entities
12. Contextual actions
13. Empty state
14. Loading state
15. Error state
16. Confirmation dialogs
17. Toast feedback

---

# 3. TECHNOLOGY

Use the existing project stack if one already exists.

If starting from scratch, prefer:

* React
* TypeScript
* Vite
* React Router
* Tailwind CSS
* Lucide icons or another open-source icon library
* A lightweight state-management solution when useful
* localStorage for persistence

Do NOT introduce unnecessary dependencies.

Keep the application modular.

Use reusable components instead of duplicating pages.

---

# 4. APPLICATION STRUCTURE

Create a professional application architecture similar to:

src/

app/
router/
providers/
layout/

components/
ui/
navigation/
tables/
forms/
modals/
drawers/
filters/
cards/
charts/
editors/

features/
dashboard/
orders/
products/
inventory/
customers/
marketing/
discounts/
analytics/
content/
online-store/
apps/
settings/

data/
products.json
orders.json
customers.json
inventory.json
locations.json
collections.json
discounts.json
products-media.json
analytics.json
notifications.json
users.json

hooks/

lib/
storage/
formatters/
validators/
search/
filters/

types/

utils/

Keep business/domain models separate from UI components.

---

# 5. GLOBAL APPLICATION SHELL

Build the entire Shopify-style Admin shell first.

Desktop layout:

LEFT SIDEBAR
MAIN CONTENT
OPTIONAL RIGHT-SIDE DRAWER

The shell should include:

* Store switcher
* Main navigation
* Expandable navigation groups
* Active route indication
* Settings access
* Account/profile area
* Search
* Notifications
* Help
* Main content header
* Breadcrumbs where appropriate
* Contextual page actions

The sidebar should remain visually consistent throughout the application.

Do not make every page look like an independent dashboard.

The entire application must feel like one coherent product.

---

# 6. VISUAL LANGUAGE

Use a restrained Shopify-like merchant UI language:

* White/light neutral surfaces
* Subtle borders
* Very light gray page backgrounds
* Rounded cards
* Compact controls
* Dense but readable tables
* Strong typography hierarchy
* Small status badges
* Clean iconography
* Minimal shadows
* Consistent spacing
* Consistent button hierarchy
* Consistent form controls
* Consistent tables
* Consistent drawers/modals

Do not over-design.

Do not use:

* giant gradients
* excessive glassmorphism
* neon colors
* oversized cards
* unnecessary animations
* generic SaaS landing-page styling

The UI should feel operational, professional and information-dense.

---

# 7. RESPONSIVE DESIGN

Support:

* Large desktop
* Laptop
* Tablet
* Mobile

Desktop should prioritize productivity.

Mobile should transform navigation into an appropriate mobile navigation pattern rather than simply shrinking the desktop UI.

Tables must remain usable on smaller screens.

---

# 8. GLOBAL SEARCH

Implement a real global search.

Search across:

* Products
* Orders
* Customers
* Collections
* Discounts

The search interface should:

* Open from the global header
* Accept keyboard input
* Show grouped results
* Display icons/status
* Show relevant metadata
* Allow keyboard navigation
* Navigate directly to the entity
* Show "no results"
* Handle partial matches

Example:

Search:

"blue shirt"

Results:

Products

* Classic Blue Shirt

Orders

* #1048

Customers

* John Smith

---

# 9. DASHBOARD

Create a realistic merchant dashboard.

Include:

* Total sales
* Net sales
* Orders
* Average order value
* Returning customer rate
* Conversion-related metrics
* Sales graph
* Sales by channel
* Top products
* Recent orders
* Customer metrics
* Inventory alerts
* Tasks/recommendations

Charts must use demo JSON data.

Charts must respond to date-range changes.

Provide date presets:

* Today
* Yesterday
* Last 7 days
* Last 30 days
* Last 90 days
* This year
* Custom

Changing the date range must update displayed metrics using demo data.

---

# 10. ORDERS

Create a complete Orders experience.

Route:

/orders

Include:

* All orders
* Draft orders
* Abandoned checkouts if appropriate
* Returns/refunds where applicable

Orders table:

* Checkbox
* Order number
* Date
* Customer
* Channel
* Payment status
* Fulfillment status
* Total
* Items

Implement:

* Search
* Filtering
* Sorting
* Pagination
* Bulk selection
* Bulk fulfillment
* Bulk tagging
* Bulk cancellation where appropriate

Order detail page:

/orders/:id

Include:

* Order header
* Order number
* Date
* Status
* Customer
* Contact information
* Shipping address
* Billing information
* Line items
* Product thumbnails
* Quantities
* Prices
* Discounts
* Taxes
* Subtotal
* Shipping
* Total
* Payment status
* Fulfillment status
* Timeline/activity
* Notes
* Tags
* Customer information
* Shipping information
* Refund action
* Cancel action
* Fulfill action
* Edit order where appropriate

Actions must actually update local state.

Example:

Click "Fulfill"

→ fulfillment modal/drawer

→ select items

→ confirm

→ order status changes

→ timeline receives new event

→ toast appears.

---

# 11. PRODUCTS

Create a complete Products system.

Route:

/products

Product table:

* Checkbox
* Product image
* Product title
* Status
* Inventory
* Product type
* Vendor
* Sales channels
* Updated date

Implement:

* Search
* Filters
* Sorting
* Pagination
* Bulk editing
* Bulk delete
* Bulk archive
* Bulk tagging
* Status changes

Product detail:

/products/:id

Sections:

* Title
* Description
* Media
* Pricing
* Compare-at price
* Cost
* Inventory
* SKU
* Barcode
* Shipping
* Variants
* Product organization
* Product type
* Vendor
* Collections
* Tags
* Sales channels
* SEO
* Metafields
* Status

---

# 12. PRODUCT EDITOR

Build a realistic product editor.

Fields:

* Title
* Description
* Media
* Price
* Compare-at price
* Cost per item
* SKU
* Barcode
* Inventory tracking
* Quantity
* Weight
* Shipping requirement
* Product category
* Product type
* Vendor
* Collections
* Tags
* Search engine listing
* Sales channels
* Status

Implement:

* Save
* Save and continue
* Cancel
* Delete
* Duplicate
* Archive
* Preview

Use a rich-text-like description editor if practical.

---

# 13. PRODUCT MEDIA

Support demo media management.

Allow:

* Add image
* Remove image
* Reorder images
* Set featured image

For the frontend-only version, use demo image URLs and/or local assets.

Do not require real cloud storage.

---

# 14. VARIANTS

Support products with multiple variants.

Example:

T-Shirt

Options:

Color:

* Black
* White
* Blue

Size:

* S
* M
* L
* XL

Generate combinations.

Each variant can have:

* SKU
* Price
* Barcode
* Inventory
* Weight
* Image
* Availability

Editing a variant must update the product state.

---

# 15. COLLECTIONS

Create:

/collections

Support:

* Manual collections
* Automated/smart collections

Collection fields:

* Title
* Description
* Image
* Products
* Handle
* SEO
* Status

Implement product assignment/removal.

---

# 16. INVENTORY

Create a complete inventory interface.

Routes:

/inventory

/locations

Inventory table:

* Product
* SKU
* Available
* Committed
* Unavailable
* On hand
* Location

Support:

* Inventory adjustment
* Transfer
* Location selection
* Search
* Filters
* Sorting
* Bulk operations

Inventory should be connected to products and variants.

Changing inventory should affect product inventory displays.

---

# 17. LOCATIONS

Create location management.

Location fields:

* Name
* Address
* Phone
* Active status
* Inventory count

Allow:

* Create
* Edit
* Activate/deactivate

---

# 18. CUSTOMERS

Create:

/customers

Customer table:

* Name
* Email
* Phone
* Orders
* Amount spent
* Location
* Last order
* Customer status

Customer detail:

/customers/:id

Include:

* Customer profile
* Contact information
* Address
* Orders
* Total spent
* Average order value
* Tags
* Notes
* Timeline
* Marketing consent
* Customer activity

Allow:

* Create
* Edit
* Delete
* Add tags
* Remove tags
* Add note

---

# 19. DISCOUNTS

Create:

/discounts

Support:

* Discount codes
* Automatic discounts

Discount types:

* Percentage
* Fixed amount
* Free shipping
* Buy X get Y

Fields:

* Code
* Title
* Discount type
* Value
* Minimum purchase
* Customer eligibility
* Product eligibility
* Usage limit
* Start date
* End date
* Active status

Implement creation and editing.

---

# 20. MARKETING

Create a marketing area.

Include:

* Marketing overview
* Campaigns
* Campaign performance
* Activity

Demo metrics:

* Reach
* Sessions
* Orders
* Revenue
* Conversion
* ROI

Campaigns should be represented by JSON.

---

# 21. ANALYTICS

Create a realistic analytics section.

Include:

* Overview
* Sales
* Customers
* Products
* Marketing

Charts:

* Sales over time
* Orders over time
* Average order value
* Customer acquisition
* Returning customers
* Top products
* Sales by channel

Allow:

* Date range
* Comparison period
* Filters

Changing filters must modify chart data.

---

# 22. CONTENT

Create a content management section.

Include:

* Files
* Pages
* Blog posts
* Navigation

Pages:

* Title
* Content
* Handle
* SEO
* Status

Blog posts:

* Title
* Author
* Content
* Featured image
* Tags
* Publication status
* Published date

---

# 23. ONLINE STORE

Create an Online Store section.

Include:

* Themes
* Navigation
* Pages
* Preferences

For the frontend-only implementation, theme editing can be simulated.

Create:

* Current theme card
* Theme preview
* Customize button
* Theme actions
* Theme list

The UI should resemble a real merchant theme management workflow.

---

# 24. FILES

Create a file manager.

Support:

* Grid view
* List view
* Search
* Filters
* File details
* Delete
* Rename
* Select multiple files

Use demo media.

---

# 25. NAVIGATION

Create menu management.

Support:

* Main menu
* Footer menu
* Nested links

Allow:

* Add link
* Remove link
* Rename link
* Reorder links
* Nest links

Changes should persist in localStorage.

---

# 26. STAFF AND PERMISSIONS

Create:

/settings/users

Display:

* Staff members
* Roles
* Status
* Last active

Allow editing permissions through a simulated permission editor.

Example permissions:

Products:

* View
* Create
* Edit
* Delete

Orders:

* View
* Edit
* Refund
* Cancel

Customers:

* View
* Edit

Analytics:

* View

Settings:

* View
* Edit

Permissions should actually affect the UI.

---

# 27. SETTINGS

Create a realistic Settings experience.

Sections:

* Store details
* General
* Payments
* Checkout
* Customer accounts
* Shipping
* Taxes
* Locations
* Notifications
* Policies
* Users and permissions
* Sales channels
* Apps

Settings can use JSON/localStorage.

Forms must actually save.

---

# 28. APPS

Create an Apps section.

Display installed demo apps.

Include:

* App icon
* App name
* Description
* Status
* Permissions
* Open
* Manage
* Uninstall

Apps can be simulated.

---

# 29. TABLE SYSTEM

Build ONE reusable data-table system.

Features:

* Checkbox selection
* Select all
* Column headers
* Sorting
* Pagination
* Row actions
* Bulk actions
* Search
* Filters
* Responsive behavior
* Empty states
* Loading states

Do not build separate incompatible table implementations for every page.

---

# 30. FILTER SYSTEM

Build reusable filter components.

Support:

* Text
* Select
* Multi-select
* Date range
* Number range
* Status
* Boolean

Filters must be combinable.

Example:

Products

Status = Active

Inventory < 10

Vendor = Nike

Search = Shirt

The table must update correctly.

---

# 31. BULK ACTIONS

Bulk selection should be a real feature.

Example:

Select 5 products.

Show contextual bulk-action toolbar.

Actions:

* Archive
* Delete
* Add tags
* Remove tags
* Change status
* Edit inventory

Every action must modify local application state.

---

# 32. DRAWERS AND MODALS

Use drawers for contextual editing where appropriate.

Use modals for:

* Confirmation
* Small forms
* Destructive actions
* Quick actions

Drawers should:

* Animate smoothly
* Lock appropriate background interaction
* Support Escape
* Have close controls
* Preserve form state appropriately

---

# 33. TOASTS

Implement a reusable toast system.

Examples:

"Product saved"

"Order fulfilled"

"Customer updated"

"Inventory adjusted"

"Product deleted"

"Changes saved"

Toasts should appear after successful actions.

---

# 34. CONFIRMATION DIALOGS

Destructive operations must require confirmation.

Examples:

Delete product

Delete customer

Cancel order

Refund order

Delete discount

Remove staff member

Confirmation dialogs must clearly explain the action.

---

# 35. LOCAL DATA ARCHITECTURE

Create realistic JSON demo data.

At minimum generate:

* 50+ products
* 100+ product variants
* 50+ customers
* 100+ orders
* 5+ locations
* 10+ collections
* 15+ discounts
* 20+ files
* 10+ campaigns
* 10+ staff members
* analytics datasets
* activity/timeline data

Do not use repetitive placeholder data.

Create believable ecommerce data.

Use relationships between entities.

For example:

Order line item:

productId
variantId
quantity
price

Customer:

id

Orders reference customerId.

Products reference collection IDs.

Variants belong to products.

Inventory references variants and locations.

---

# 36. DATA RELATIONSHIPS

Maintain a coherent domain model.

Conceptually:

Store
│
├── Products
│   ├── Variants
│   ├── Media
│   ├── Collections
│   └── Inventory
│
├── Orders
│   ├── Customer
│   ├── Line Items
│   ├── Payments
│   ├── Fulfillments
│   ├── Returns
│   └── Timeline
│
├── Customers
│   └── Orders
│
├── Locations
│   └── Inventory
│
├── Discounts
│
├── Marketing
│
└── Settings

Do not create disconnected demo pages.

---

# 37. STATE MANAGEMENT

Create a centralized application state layer.

The application should behave as though a backend exists.

For example:

createProduct()

updateProduct()

deleteProduct()

archiveProduct()

createOrder()

updateOrder()

cancelOrder()

fulfillOrder()

refundOrder()

createCustomer()

updateCustomer()

adjustInventory()

createDiscount()

updateSettings()

The UI calls these actions instead of directly manipulating random JSON objects.

---

# 38. LOCALSTORAGE

Persist user changes.

On first launch:

Load JSON seed data.

Then:

Persist modified state to localStorage.

On refresh:

Restore modified state.

Provide a development-only reset-data mechanism if useful.

---

# 39. SIMULATED API LAYER

Even though there is no backend, structure the frontend as if there were one.

Example:

services/
productsService.ts
ordersService.ts
customersService.ts
inventoryService.ts

The service layer can currently operate against local state/localStorage.

Later it should be possible to replace:

localStorage implementation

with:

REST/GraphQL API

without rewriting the UI.

---

# 40. ROUTING

Implement real routes.

Example:

/admin

/admin/orders

/admin/orders/:id

/admin/products

/admin/products/new

/admin/products/:id

/admin/products/:id/edit

/admin/inventory

/admin/inventory/transfers

/admin/locations

/admin/customers

/admin/customers/:id

/admin/collections

/admin/discounts

/admin/marketing

/admin/analytics

/admin/content

/admin/content/pages

/admin/content/blog

/admin/online-store

/admin/online-store/themes

/admin/online-store/navigation

/admin/files

/admin/apps

/admin/settings

/admin/settings/general

/admin/settings/users

/admin/settings/payments

etc.

URLs should remain meaningful and bookmarkable.

---

# 41. NAVIGATION BEHAVIOR

All navigation must work.

Do not create dead links.

If a feature is not implemented yet, either:

1. implement a useful version, or
2. create an intentional placeholder state explaining that the feature is coming.

Never make clicking a navigation item do nothing.

---

# 42. UX DETAILS

Pay close attention to:

* Hover states
* Focus states
* Disabled states
* Active states
* Keyboard navigation
* Escape handling
* Form validation
* Error messages
* Loading states
* Empty states
* Pagination
* Sticky headers where appropriate
* Sticky action bars where appropriate
* Scroll behavior
* Table density
* Sidebar behavior
* Breadcrumbs
* Contextual actions

---

# 43. FORMS

Every form must have:

* Labels
* Proper input types
* Validation
* Error states
* Save state
* Cancel
* Disabled state while saving
* Success feedback

Do not build forms that visually work but do not actually update data.

---

# 44. PERFORMANCE

Avoid unnecessary re-renders.

Use:

* Memoization where appropriate
* Efficient filtering
* Efficient list rendering
* Lazy loading for large sections
* Component decomposition

Do not prematurely optimize everything.

Prioritize maintainability.

---

# 45. ACCESSIBILITY

Implement:

* Semantic HTML
* Keyboard navigation
* Focus management
* Accessible labels
* Accessible buttons
* Dialog accessibility
* Appropriate ARIA where necessary
* Sufficient contrast

---

# 46. ICONS

Use an open-source icon library.

Do not recreate proprietary Shopify icons.

Icons should be:

* Consistent
* Small
* Functional
* Visually restrained

---

# 47. DEMO DATA

The demo store should feel real.

Create a believable fictional merchant.

Example:

Store:
"Northstar Goods"

Products:

* Classic Cotton T-Shirt
* Everyday Hoodie
* Canvas Backpack
* Minimal Sneakers
* Ceramic Coffee Mug
* Leather Wallet
* Oversized Shirt
* Running Cap

Customers should have believable names, addresses and order histories.

Orders should reference actual products/customers.

Inventory should correspond to variants.

Analytics should correspond approximately to order data.

---

# 48. REALISTIC BUSINESS LOGIC

Implement frontend simulation of business rules.

Examples:

If an order is fulfilled:

* fulfillment status changes
* inventory decreases where appropriate
* timeline event appears

If an order is refunded:

* payment status updates
* refund record appears
* timeline updates

If a product is archived:

* status changes
* product disappears from active product views

If inventory is adjusted:

* inventory totals update
* product inventory updates
* inventory history records the change

If customer information changes:

* customer detail updates
* order references remain intact

---

# 49. PRODUCT SEARCH AND FILTER EXAMPLE

Product list should support:

Search

Status

Inventory

Product type

Vendor

Collection

Sales channel

Tags

When filters change:

URL query parameters should preferably reflect the active filters.

Example:

/admin/products?status=active&inventory=low

---

# 50. ORDER FILTERS

Support:

* Payment status
* Fulfillment status
* Date
* Customer
* Channel
* Total
* Tags

---

# 51. CUSTOMER FILTERS

Support:

* Location
* Orders
* Amount spent
* Marketing consent
* Tags
* Date joined

---

# 52. ANALYTICS INTERACTION

Analytics should not just display static charts.

Date range changes should update:

* Revenue
* Orders
* Customers
* AOV
* Charts
* Product rankings

Use deterministic demo data.

---

# 53. EMPTY STATES

Every list must have a proper empty state.

Example:

No products found.

Include:

* Explanation
* Primary action
* Secondary action where useful

Differentiate between:

"No data exists"

and:

"No results match your filters"

---

# 54. LOADING STATES

Simulate small asynchronous delays where useful so the UI can demonstrate:

* Loading skeletons
* Disabled actions
* Saving states

Do not make the application unnecessarily slow.

---

# 55. ERROR STATES

Simulate errors where appropriate.

For example:

Failed to save product.

Provide:

* Error message
* Retry action

---

# 56. URL STATE

Where appropriate, synchronize:

* Search
* Filters
* Sort
* Pagination
* Tabs

with the URL.

This makes the application feel like a real admin product.

---

# 57. KEYBOARD SHORTCUTS

Implement useful shortcuts where practical.

Examples:

/

Focus search

Escape

Close modal/drawer

Enter

Submit focused form

Do not implement shortcuts that interfere with normal browser behavior.

---

# 58. NO PLACEHOLDER DASHBOARD

Do not stop after building:

Sidebar + Dashboard + 3 cards.

The objective is a COMPLETE merchant back office.

Every major navigation section must contain meaningful functionality.

---

# 59. DEVELOPMENT STRATEGY

Build in this order:

PHASE 1
Application shell

PHASE 2
Design system

PHASE 3
Data models

PHASE 4
State/service layer

PHASE 5
Products

PHASE 6
Orders

PHASE 7
Customers

PHASE 8
Inventory

PHASE 9
Collections

PHASE 10
Discounts

PHASE 11
Analytics

PHASE 12
Marketing

PHASE 13
Content

PHASE 14
Online Store

PHASE 15
Apps

PHASE 16
Settings

PHASE 17
Global search

PHASE 18
Polish and QA

Do not jump randomly between unrelated modules.

---

# 60. IMPLEMENTATION RULE

Before creating a page, determine:

What entities does this page operate on?

What actions can the merchant perform?

What states can the entity have?

What relationships exist?

What filters are useful?

What bulk operations are useful?

What related entities should be visible?

Then implement the page.

---

# 61. CODE QUALITY

Use:

* Strong TypeScript types
* Reusable components
* Reusable hooks
* Reusable services
* Centralized formatting
* Centralized validation
* Clear naming
* Small components
* Feature-based organization

Avoid:

* giant monolithic components
* duplicated tables
* duplicated modal code
* hardcoded data inside JSX
* inline business logic everywhere
* random global variables
* unnecessary dependencies

---

# 62. DO NOT FAKE FUNCTIONALITY

This is extremely important.

Never create a button just because the design contains one.

If the UI says:

"Delete"

it must delete.

If it says:

"Save"

it must save.

If it says:

"Archive"

it must archive.

If it says:

"Refund"

it must update the simulated order/payment state.

If it says:

"Adjust inventory"

it must change inventory.

Every interaction must have a meaningful result.

---

# 63. VISUAL QA

After implementing each major section:

1. Run the application.
2. Inspect every page.
3. Test navigation.
4. Test forms.
5. Test tables.
6. Test filters.
7. Test search.
8. Test bulk actions.
9. Test modals.
10. Test drawers.
11. Test mobile layout.
12. Fix visual inconsistencies.

Do not assume the implementation is correct because the code compiles.

---

# 64. ROUTE QA

Verify that every route:

* Loads directly
* Can be navigated to
* Has correct active navigation
* Has working back navigation
* Does not throw runtime errors
* Does not contain dead buttons

---

# 65. DATA QA

Verify:

* Every order references a real customer
* Every order item references a real product/variant
* Inventory references valid variants
* Collections reference valid products
* Customer order counts are coherent
* Dashboard metrics are generated from the demo dataset where practical

---

# 66. FINAL QUALITY BAR

The finished application should feel like:

"A real Shopify-style ecommerce operating system using simulated data."

It should NOT feel like:

"A template dashboard with Shopify-colored cards."

Prioritize:

1. Shopify-like information architecture
2. Shopify-like interaction patterns
3. Shopify-like density
4. Shopify-like merchant workflows
5. Consistency
6. Functional interactions
7. Realistic data
8. Maintainable architecture

---

# 67. IMPORTANT IMPLEMENTATION CONSTRAINT

Do not attempt to build a real backend during this phase.

Do not create:

* PostgreSQL
* MongoDB
* Firebase
* Supabase
* Express backend
* Django backend
* Shopify API integration
* Real authentication server
* Real payment gateway

Everything must work entirely in the browser.

Use:

JSON seed data
+
React state
+
localStorage
+
simulated services

---

# 68. FUTURE-BACKEND COMPATIBILITY

Even though this is frontend-only, design interfaces that could later become:

GET /products

POST /products

PUT /products/:id

DELETE /products/:id

GET /orders

GET /orders/:id

POST /orders/:id/fulfill

POST /orders/:id/refund

GET /customers

etc.

Do not couple components directly to JSON files.

---

# 69. FIRST TASK

Before writing implementation code:

1. Inspect the existing repository.
2. Determine the current framework.
3. Determine existing dependencies.
4. Determine whether routing already exists.
5. Determine whether Tailwind/design system already exists.
6. Determine whether there is existing application code worth preserving.

Do not unnecessarily rewrite an existing working project.

Then create an implementation plan.

After the plan, begin implementation.

---

# 70. ITERATIVE EXECUTION

Do not attempt to produce a superficial implementation of every feature in one pass.

Implement complete vertical slices.

For example:

PRODUCTS

→ Product list

→ Search

→ Filters

→ Product detail

→ Product editor

→ Variants

→ CRUD

→ Persistence

→ QA

Then move to:

ORDERS

Then:

CUSTOMERS

Then:

INVENTORY

etc.

Each completed module must actually work before moving on.

---

# 71. SELF-REVIEW LOOP

After each major implementation:

Ask yourself:

* Does this actually work?
* Is the UI coherent with the rest of the Admin?
* Are there dead controls?
* Are states persisted?
* Are relationships maintained?
* Are empty states handled?
* Are errors handled?
* Does mobile work?
* Does the interaction feel like a merchant back office?
* Is anything unnecessarily hardcoded?
* Can this later connect to a backend without rewriting the UI?

Fix issues before proceeding.

---

# 72. FINAL DELIVERABLE

Deliver a complete working frontend.

It must include:

✓ Shopify-style Admin shell

✓ Dashboard

✓ Orders

✓ Order details

✓ Products

✓ Product editor

✓ Variants

✓ Collections

✓ Inventory

✓ Locations

✓ Customers

✓ Discounts

✓ Marketing

✓ Analytics

✓ Content

✓ Files

✓ Online Store

✓ Navigation

✓ Apps

✓ Staff

✓ Permissions

✓ Settings

✓ Global search

✓ Filtering

✓ Sorting

✓ Pagination

✓ Bulk actions

✓ Drawers

✓ Modals

✓ Toasts

✓ Form validation

✓ Empty states

✓ Loading states

✓ Error states

✓ Responsive UI

✓ JSON demo data

✓ Local persistence

✓ Simulated business logic

✓ Clean architecture

✓ No dead interactions

---

# 73. MOST IMPORTANT RULE

Do not optimize for the number of screens.

Optimize for the quality of the merchant experience.

A smaller number of deeply functional Shopify-style modules is better than dozens of beautiful but fake screens.

Build it like a real product.

Start by inspecting the repository and then begin implementation.
