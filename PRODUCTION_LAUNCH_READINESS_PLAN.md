# KLINK — Deep Whole-Application Audit & Production Launch Blueprint (Audit #4)
**Perspective:** Principal Software Engineer & Senior Product Designer  
**Target Market:** Darbhanga, Bihar (Phase 1 District Launch)  
**Scope:** End-to-End Architecture, Cloud/Vercel Deployment, Database & Financial Integrity, API Runtime Verification, Security Boundaries, and UI/UX Design Consistency

---

## 1. Executive Summary & Overall Readiness Scorecard

KLINK has evolved from an initial prototype into a feature-rich multi-tenant construction marketplace and dealer yard operating system (`@klink/web`, `@klink/api`, `@klink/database`, `@klink/shared-types`), now including Vercel serverless deployment adapters (`vercel.json`, `api/index.ts`, `packages/database/src/index.ts`), a 6-tab Founder Super-Admin Rescue Console (`AdminPortal.tsx`), URL state synchronization (`useNavigationHistory.ts`), real authentication (`AuthModal.tsx`), and an ongoing transition to the **Architectural Stone (`#FAF9F6` / `stone-*`)** B2B design language.

| Audit Pillar | Readiness Score | Current Status & Primary Blocker |
| :--- | :---: | :--- |
| **1. Build & Type Safety (`tsc`)** | **75 / 100** | `pnpm build` succeeds across all packages, but `pnpm type-check` **fails in `@klink/api`** with 3 TypeScript errors (`TS2353`, `TS7034`, `TS7005`). |
| **2. Cloud & Vercel Deployment** | **45 / 100** | SQLite `/tmp/klink.db` copy in `packages/database/src/index.ts` is **ephemeral and split-brained** on Vercel Serverless (data is wiped on cold starts and isolated per lambda instance). `.gitignore` excludes `dev.db` so Git-triggered Vercel builds have no seed DB unless `db:push && db:seed` runs in `buildCommand`. |
| **3. API Runtime & Data Integrity** | **68 / 100** | 19/22 endpoints pass live `app.inject()` tests (`<5ms`), but **3 Admin endpoints fail at runtime (`500` / `400`)** and **6 financial/inventory logic bugs** exist across Admin Rescue, Supplier Dispatch, and Ledger recalculation. |
| **4. Security & Multi-Tenancy** | **78 / 100** | Security headers, rate limiting, and live `supplier.status === 'ACTIVE'` checks are in place, but Fastify lacks `trustProxy: true` (causing all users behind Vercel/proxies to share one rate-limit bucket) and `isDemoMode` still defaults to `true` when `VITE_DEMO_MODE` is unset. |
| **5. UI/UX & Design System** | **72 / 100** | `Navbar`, `CartDrawer`, `CompareModal`, `AuthModal`, and `AdminPortal` are 100% migrated to the classy Stone/Monospace design system, but **63 `font-black`**, **16 `rounded-3xl`**, **209 `slate-*`** classes, and **36 native `alert()`/`confirm()` dialogs** remain in `CustomerMarketplace.tsx`, `SupplierPortal.tsx` modals, `StorefrontModal.tsx`, and `BottomNav.tsx`. |
| **6. Automated Test Coverage** | **10 / 100** | **0 automated test files** (`*.test.ts`) exist in the repository. |

---

## 2. Layer 1: Cloud Deployment, Infrastructure & Database Architecture Audit

### 2.1 Critical Vercel Serverless + SQLite Architecture Flaws
1. **Ephemeral `/tmp/klink.db` Data Loss & Split-Brain State (`packages/database/src/index.ts` lines 14–36):**
   - **How it currently works:** When `process.env.VERCEL` is truthy, `@klink/database` copies `packages/database/prisma/dev.db` to `/tmp/klink.db` and connects Prisma to `file:/tmp/klink.db`.
   - **Why this fails in production:**
     - **Cold-Start Amnesia:** Vercel lambda instances spin down after ~5–15 minutes of inactivity. On the next request, `/tmp/klink.db` is recreated from the static seed file—**wiping out every newly registered customer, supplier, order, stock update, and Udhaar payment!**
     - **Horizontal Split-Brain:** When two users access KLINK simultaneously (e.g., a Customer placing an order on Lambda Instance A and a Supplier viewing `/supplier/orders` on Lambda Instance B), each instance writes to its own private `/tmp/klink.db`. The supplier will never see the customer's order.
   - **Production Fix:** Migrate `datasource db` in `packages/database/prisma/schema.prisma` from `sqlite` to **PostgreSQL** (`Neon Serverless Postgres` or `Supabase` with PgBouncer connection pooling) or **Turso (`libsql`)** before onboarding real Darbhanga users.
2. **Git-Triggered Vercel Build Missing `dev.db` (`vercel.json` vs `.gitignore`):**
   - `.gitignore` (lines 23–25) ignores `*.db` and `dev.db`.
   - Root `vercel.json` sets `"buildCommand": "pnpm -r run build"` and `"includeFiles": "packages/database/prisma/dev.db"`.
   - If deployed via Git integration on Vercel, `dev.db` is not in the Git repository and `pnpm -r run build` only runs `prisma generate` (never `prisma db push` or `db:seed`), resulting in an empty or missing SQLite file.
   - **Fix (if keeping SQLite for demo previews):** Change `buildCommand` in root `vercel.json` to `"pnpm db:push && pnpm db:seed && pnpm -r run build"`.
3. **Production Boot Crash When `JWT_SECRET` Is Unset on Vercel (`apps/api/src/plugins/auth.ts` lines 18–20):**
   - Vercel automatically sets `NODE_ENV=production`.
   - `authPlugin` throws `new Error('FATAL: JWT_SECRET environment variable must be set in production!')` if `process.env.JWT_SECRET` is missing, crashing `/api/index.ts` on cold start unless `JWT_SECRET` is explicitly configured in the Vercel project dashboard.
4. **Hardcoded Local Absolute Path in `apps/api/.env`:**
   - `apps/api/.env` contains `DATABASE_URL="file:/Users/vaibhaw/Developer/KLINK/packages/database/prisma/dev.db"`. Replace this with a relative path `DATABASE_URL="file:./dev.db"` so the project works across any developer machine or CI runner.

---

## 3. Layer 2: Backend API, Type-Safety & Financial Logic Audit (`@klink/api`)

### 3.1 Compiler & Live Runtime HTTP 500/400 Bugs (Verified via `app.inject()`)

| Bug ID | Endpoint / File | Exact Failure | Root Cause | Exact Code Fix |
| :--- | :--- | :--- | :--- | :--- |
| **API-01** | `GET /api/v1/admin/payments`<br>`apps/api/src/modules/admin/routes.ts:799` | **HTTP 500 Crash** & **`TS2353` Build Error** | Queries `paymentRecord.findMany({ orderBy: { createdAt: 'desc' } })`, but `PaymentRecord` in `schema.prisma` uses `recordedAt`, not `createdAt`. | Change line 799 to `orderBy: { recordedAt: 'desc' }`. |
| **API-02** | `PATCH /api/v1/admin/supplier-products/:id`<br>`apps/api/src/modules/admin/routes.ts:318–337` | **HTTP 500 Crash** (`Unknown argument deliveryFee`) | Both `AdminPortal.tsx` (line 434) and `admin/routes.ts` (line 322) use `deliveryFee`, and pass `data` directly to `prisma.supplierProduct.update()`. The column in `schema.prisma` is `deliveryCharge`. | Map `const { deliveryFee, ...rest } = request.body;` and pass `{ ...rest, ...(deliveryFee !== undefined ? { deliveryCharge: deliveryFee } : {}) }` to Prisma. Also update `AdminPortal.tsx` line 421 (`prod.deliveryCharge`). |
| **API-03** | `PATCH /api/v1/admin/orders/:id`<br>`apps/api/src/modules/admin/routes.ts:409` | **HTTP 400 Bad Request** (`FST_ERR_VALIDATION`) | `admin/routes.ts` validates `paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'])`, whereas the database and `@klink/shared-types` use `['PENDING', 'PARTIALLY_PAID', 'PAID', 'UDHAAR']`. Saving any `PARTIALLY_PAID` or `UDHAAR` order in Admin Rescue fails with HTTP 400. | Import and use `PaymentStatusEnum` from `@klink/shared-types` in `admin/routes.ts` line 409, and update the `<select>` options in `AdminPortal.tsx`. |
| **API-04** | `POST /api/v1/supplier/orders/manual`<br>`apps/api/src/modules/supplier/routes.ts:694, 828` | **`TS7034` / `TS7005` Type Error** | `const orderItemsData = [];` is declared without a type annotation, causing `pnpm type-check` to fail in `@klink/api`. | Change line 694 to `const orderItemsData: any[] = [];`. |

---

### 3.2 Business Logic, Inventory & Financial Ledger Bugs

1. **BL-01: Direct Order Dispatch Bypasses Stock Deduction (`apps/api/src/modules/supplier/routes.ts:861–908`):**
   - **What happens:** Stock is currently only deducted inside `PATCH /supplier/orders/:id/status` when transitioning specifically from `order.status === 'PENDING_APPROVAL'` to `status === 'CONFIRMED'` (line 351).
   - However, if a supplier dispatches an order directly via `POST /supplier/orders/:id/dispatch` (or transitions `PENDING_APPROVAL` → `PREPARING`), the order jumps to `OUT_FOR_DELIVERY` **without ever deducting `stockQuantity`**!
   - **Fix:** Track a boolean `isStockReserved Boolean @default(false)` on `Order` (or deduct stock whenever an order transitions from `PENDING_APPROVAL` into *any* active fulfillment state: `CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`).
2. **BL-02: Vehicle Fleet Status Never Updates on Dispatch or Delivery (`supplier/routes.ts:861–958`):**
   - **What happens:** `SupplierVehicle` has `status` (`AVAILABLE`, `ON_TRIP`, `MAINTENANCE`). Yet when a supplier assigns a vehicle in `POST /supplier/orders/:id/dispatch`, the vehicle's status is never updated to `'ON_TRIP'`, and when `POST /supplier/orders/:id/deliver` completes the trip, the vehicle is never returned to `'AVAILABLE'`.
   - **Fix:** Inside `POST /orders/:id/dispatch` and `POST /orders/:id/deliver`, automatically update matching `SupplierVehicle` (`where: { supplierId, vehicleNumber }`) to `'ON_TRIP'` and `'AVAILABLE'` respectively.
3. **BL-03: `recalculateCustomerLedger` Prematurely Bills Unapproved Orders (`supplier/routes.ts:31–38` & `admin/routes.ts:842`):**
   - **What happens:** `recalculateCustomerLedger` sums `finalTotal` for `status: { notIn: ['CANCELLED', 'REJECTED'] }`. Because `PENDING_APPROVAL` is not excluded, a customer's Udhaar debt (`totalPurchased` and `outstandingBalance`) increases **before** the supplier has accepted their order!
   - **Fix:** Change the filter in both files to `status: { notIn: ['PENDING_APPROVAL', 'CANCELLED', 'REJECTED'] }`.
4. **BL-04: Admin Order Rescue Inflates Stock & Skips Ledger Sync (`admin/routes.ts:425–465`):**
   - **What happens:** In `PATCH /admin/orders/:id`, cancelling a `PENDING_APPROVAL` order (`!isOldDead && isNewDead`) increments `stockQuantity` even though `PENDING_APPROVAL` orders never had stock deducted! Furthermore, `PATCH /admin/orders/:id` never calls `recalculateCustomerLedger()`, leaving `CustomerLedger` out of sync after an Admin edits `finalTotal` or `status`.
5. **BL-05: Admin Udhaar Balance Adjustment Overwritten on Next Transaction (`admin/routes.ts:714–778`):**
   - **What happens:** `PATCH /admin/customers/:id/balance` directly updates `CustomerLedger.outstandingBalance = newBalance` without creating a compensating `PaymentRecord` or adjusting open `Order` balances. The next time `recalculateCustomerLedger()` runs for that customer, it recalculates `totalPurchased - totalPaid` from `Order` and `PaymentRecord` rows, **erasing the Admin's manual adjustment**.
6. **BL-06: Admin Customer District Edit Silently Ignored (`AdminPortal.tsx:450, 461` ↔ `admin/routes.ts:696`):**
   - **What happens:** `AdminPortal.tsx` sends `districtId: editCustDistrictId`, while `PATCH /admin/customers/:id` only accepts `defaultDistrictId` in its Zod schema—silently dropping the field.
7. **BL-07: `POST /supplier/orders/:id/payments` Requires Redundant `customerId` in Body (`supplier/routes.ts:380`):**
   - **What happens:** `RecordPaymentInputSchema` requires `customerId: z.string().min(1)` in the POST body even though the endpoint looks up `order.customerId` from `:id`. Make `customerId` optional in `RecordPaymentInputSchema`.

---

## 4. Layer 3: Security, Rate-Limiting & Multi-Tenant Boundaries Audit

1. **SEC-01: Rate Limiter Collapses Behind Vercel / Reverse Proxies (`apps/api/src/app.ts` & `plugins/security.ts:44`):**
   - `buildApp()` initializes `Fastify({ logger: ... })` without `trustProxy: true`.
   - When deployed on Vercel or behind Nginx/Cloudflare, `request.ip` is the internal proxy IP for all incoming traffic—meaning **all users across Darbhanga share a single rate-limit bucket** (`15` login attempts/min total across the entire platform, `300` API requests/min total).
   - **Fix:** Add `trustProxy: true` to `Fastify({ trustProxy: true, logger: ... })` in `apps/api/src/app.ts`.
2. **SEC-02: Unrestricted CORS Reflection (`apps/api/src/app.ts:34–37`):**
   - `app.register(cors, { origin: true, credentials: true })` reflects any arbitrary origin with `Access-Control-Allow-Credentials: true`.
   - **Fix:** Restrict `origin` in production to `process.env.ALLOWED_ORIGINS?.split(',') || true`.
3. **SEC-03: Demo Mode Defaults to `true` in Production Builds (`apps/web/src/lib/auth-context.tsx:50–54`):**
   - `return import.meta.env.VITE_DEMO_MODE !== 'false';` enables Demo Sandbox auto-login (`9123456789` / `customer123`) and the 1-click Persona Switcher by default whenever `VITE_DEMO_MODE` is not explicitly set to `'false'`.
   - **Fix:** Before public launch, invert the default to `import.meta.env.VITE_DEMO_MODE === 'true'` so production visitors land in unauthenticated browsing mode and use `AuthModal` to sign in.
4. **SEC-04: Password Reset & Account Recovery Flow Missing (`auth/routes.ts` & `AuthModal.tsx`):**
   - If a customer or supplier forgets their password, there is no self-service OTP password reset endpoint—they must currently contact the Admin to reset their password via `PATCH /admin/users/:id`.

---

## 5. Layer 4: Frontend Architecture, State & Performance Audit (`@klink/web`)

1. **FE-01: Monolithic 465 KB Single Bundle (`apps/web/src/App.tsx`):**
   - `App.tsx` eagerly imports `CustomerMarketplace.tsx` (`64 KB`), `SupplierPortal.tsx` (`157 KB`), and `AdminPortal.tsx` (`128 KB`), producing a single `465.25 KB` (`104.34 KB` gzipped) JS bundle.
   - **Fix:** Lazy-load `SupplierPortal` and `AdminPortal` via `React.lazy()` + `<Suspense>` so customers on mobile 4G download `<150 KB` of JS.
2. **FE-02: 10-Request Waterfall on Every Status Filter Change in `SupplierPortal.tsx` (Lines 291–318):**
   - In `SupplierPortal.tsx`, a single `useEffect` depends on `[user, selectedStatus, isDemoMode]` and fires **10 parallel API requests** (`loadDashboard`, `loadProducts`, `loadOrders`, `loadLedger`, `loadDeliveries`, `loadCustomers`, `loadVehicles`, `loadProfile`, `/catalog/master-products`, `/catalog/categories`) every single time the supplier clicks an Order status filter pill (`ALL`, `PENDING_APPROVAL`, `CONFIRMED`, etc.)!
   - **Fix:** Split `useEffect` into two: one on `[user, isDemoMode]` for initial portal data, and a dedicated `useEffect([user, selectedStatus])` that **only** calls `loadOrders()`.
3. **FE-03: Cart Stale Price / Stock Desynchronization (`apps/web/src/lib/cart-context.tsx`):**
   - Cart items are persisted in `localStorage` with static `unitPrice` and `deliveryCharge`. If a dealer changes their price or disables a product, the cart continues showing the old price until checkout.
   - **Fix:** Re-fetch `/marketplace/suppliers/:supplierId/storefront` when `CartDrawer` opens to sync live `sellingPrice`, `deliveryCharge`, and `stockQuantity`.
4. **FE-04: Viewport Accessibility Lock (`apps/web/index.html:6`):**
   - `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />` blocks pinch-to-zoom, which fails Lighthouse accessibility audits and prevents older contractors from zooming in on small Challan text. Remove `maximum-scale=1.0, user-scalable=no` and rely on `16px` (`text-base`) inputs to prevent iOS auto-zoom.
5. **FE-05: PWA Manifest Uses SVG-Only Icon (`apps/web/public/manifest.json`):**
   - `manifest.json` only lists `/icon.svg`. Chrome on Android requires at least one `192x192` and one `512x512` `image/png` icon to generate a native WebAPK install prompt.

---

## 6. Layer 5: Senior Product Designer UI/UX Consistency & Feature Audit

### 6.1 Quantitative Design System Audit (Where Legacy Styling Still Remains)
While `Navbar.tsx`, `CartDrawer.tsx`, `CompareModal.tsx`, `AuthModal.tsx`, `ForcePasswordChangeModal.tsx`, and `AdminPortal.tsx` have been cleanly migrated to the **Warm Stone (`#FAF9F6` / `stone-*`), Monospace Tabular Numerals (`font-mono tabular-nums`), and Crisp `rounded-xl`** design language, **4 files still contain legacy prototype styling**:

| File | `font-black` Count | `rounded-3xl` Count | `slate-*` Count | Native `alert`/`confirm` | Exact Sections Needing Classy Redesign |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`views/CustomerMarketplace.tsx`** | **28** | **5** | **79** | **2** | • Top segmented sub-nav (`Darbhanga Yards & Depots` / `My Site Orders`)<br>• `My Site Orders` cards (`rounded-3xl`, `font-black`, emoji truck banner)<br>• Inside-Yard Storefront header (`bg-[#080C14] rounded-3xl`), product cards, floating indigo cart bar, and Budget Calculator modal |
| **`views/SupplierPortal.tsx`** | **25** | **10** | **92** | **14** | • Main tabs are migrated to `stone-*`, but **all 8 Modals** (Manual Order, Record Payment, Dispatch Truck, Confirm Delivered, Add Master Product, Edit Rate, Add Vehicle) still use `rounded-3xl`, `font-black`, `bg-blue-600`, and `bg-amber-500` |
| **`components/StorefrontModal.tsx`** | **9** | **1** | **26** | **0** | • Entire modal uses legacy `rounded-3xl`, `#080C14` gradient header, and `from-amber-500 to-orange-500` buttons |
| **`components/BottomNav.tsx`** | **1** | **0** | **12** | **0** | • Admin subtabs use `text-stone-100`, while Customer and Supplier subtabs still use `bg-[#0B0F19]/95`, `text-amber-400`, and `text-blue-400` |
| **`views/AdminPortal.tsx`** | **0** | **0** | **4** | **17** | • 17 native `alert()`/`confirm()` dialogs need replacement with toast/modal components |

### 6.2 Missing High-Impact UX Flows From the Product Roadmap
1. **Customer Passbook / Khata Statement Drawer (`SupplierPortal.tsx` & `CustomerMarketplace.tsx`):**
   - In `SupplierPortal.tsx` (`Udhaar` tab), a supplier can see a customer's aggregate `Total Purchased`, `Total Settled`, and `Outstanding Udhaar`, and click `Settle`—but cannot click a customer to open their **chronological Bahi-Khata statement** (listing every Order debit and Payment credit with dates, modes, and a **1-Tap WhatsApp Payment Reminder** link).
   - Similarly, customers in `CustomerMarketplace.tsx` (`My Site Orders` tab) have no summary header showing their net Udhaar balance across yards.
2. **Admin Payments Audit Table & District Activation Toggles (`AdminPortal.tsx`):**
   - `GET /api/v1/admin/payments` and `DELETE /api/v1/admin/payments/:id` are implemented in `admin/routes.ts` (lines 782–869), **but have no UI in `AdminPortal.tsx`**.
   - In `AdminPortal.tsx` (`Overview` → `District Rollout Status`), all districts are hardcoded to display a green `Live` badge even for Phase 2 districts, with no toggle to activate/deactivate districts (`PATCH /api/v1/geo/districts/:id`).
3. **Supplier Multi-District Delivery Area Checkboxes (`SupplierPortal.tsx` Profile Tab):**
   - `SupplierServiceArea` is in the database and returned by `GET /supplier/profile`, but suppliers cannot select additional service districts (e.g., expanding delivery from Darbhanga to Madhubani) in their Profile tab.

---

## 7. Prioritized Master Execution Roadmap to Production Launch

### Phase 1: Immediate P0 Fixes (Compiler, Runtime 500s & Financial Integrity)
- [ ] **Fix `pnpm type-check` & Live API 500/400 Crashes (`admin/routes.ts`, `supplier/routes.ts`, `AdminPortal.tsx`):**
  1. Change `orderBy: { createdAt: 'desc' }` → `orderBy: { recordedAt: 'desc' }` in `GET /admin/payments` (`admin/routes.ts:799`).
  2. Map `deliveryFee` → `deliveryCharge` in `PATCH /admin/supplier-products/:id` (`admin/routes.ts:327`) and read `prod.deliveryCharge` in `AdminPortal.tsx:421`.
  3. Align `paymentStatus` enum in `PATCH /admin/orders/:id` (`admin/routes.ts:409`) and `AdminPortal.tsx` to `['PENDING', 'PARTIALLY_PAID', 'PAID', 'UDHAAR']`.
  4. Map `districtId` → `defaultDistrictId` in `PATCH /admin/customers/:id` (`admin/routes.ts:696`) and fix `cust.district?.id` in `AdminPortal.tsx:450`.
  5. Add explicit type `const orderItemsData: any[] = [];` in `supplier/routes.ts:694`.
- [ ] **Fix Stock, Vehicle & Ledger Accounting Flaws (`supplier/routes.ts`, `admin/routes.ts`):**
  1. Exclude `'PENDING_APPROVAL'` from `orderSum` in `recalculateCustomerLedger()`.
  2. Deduct stock if an order is dispatched directly from `PENDING_APPROVAL` in `POST /supplier/orders/:id/dispatch`, and check `stockQuantity >= item.quantity` in `POST /supplier/orders/manual`.
  3. Automatically toggle `SupplierVehicle.status` to `'ON_TRIP'` on dispatch and `'AVAILABLE'` on delivery completion.
  4. Fix `PATCH /admin/orders/:id` so cancelling a `PENDING_APPROVAL` order does not inflate stock, and call `recalculateCustomerLedger()`.
  5. Persist Admin Udhaar balance adjustments (`PATCH /admin/customers/:id/balance`) via an audit `PaymentRecord` so `recalculateCustomerLedger()` does not overwrite them.

### Phase 2: Complete the Classy Architectural B2B UI Unification
- [ ] **Unify Remaining Views & Modals to `stone-*` / `font-mono` / `rounded-xl`:**
  1. Refactor `CustomerMarketplace.tsx` (top sub-nav, `My Site Orders` cards, Inside-Yard Storefront view, floating cart bar, and Budget Calculator modal) to remove all 28 `font-black`, 5 `rounded-3xl`, and 79 `slate-*` classes.
  2. Refactor the 8 action modals at the bottom of `SupplierPortal.tsx` to match the classy `stone-900` / `#FAF9F6` table aesthetic.
  3. Unify `BottomNav.tsx` and `StorefrontModal.tsx` to the `stone-*` palette and replace the 36 native `alert()`/`confirm()` calls with a clean Toast & Confirmation Modal system.
- [ ] **Optimize Frontend Performance (`App.tsx` & `SupplierPortal.tsx`):**
  1. Decouple `loadOrders()` from the 10-query initial load `useEffect` in `SupplierPortal.tsx`.
  2. Lazy-load `SupplierPortal` and `AdminPortal` in `App.tsx` using `React.lazy()`.

### Phase 3: Production Infrastructure, Missing Features & Automated Tests
- [ ] **Cloud Database & Proxy Hardening:**
  1. Migrate Prisma `datasource db` from ephemeral `/tmp` SQLite to managed PostgreSQL (Neon / Supabase) with `Decimal(12,2)` currency columns.
  2. Enable `trustProxy: true` in `apps/api/src/app.ts` and configure explicit `ALLOWED_ORIGINS`.
- [ ] **Wire Remaining Roadmap Features:**
  1. Add Customer Khata Statement Drawer + 1-Tap WhatsApp Reminder in `SupplierPortal.tsx`.
  2. Wire the `GET / DELETE /admin/payments` audit table and District `isActive` toggles into `AdminPortal.tsx`.
- [ ] **Automated Integration Test Suite (`vitest`):**
  1. Add `apps/api/src/__tests__/api.test.ts` covering all 22+ endpoints and ledger invariants so `pnpm test` runs in CI.
