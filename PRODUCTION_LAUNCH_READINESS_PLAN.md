# KLINK — Production Launch Readiness & Classy UI Redesign Blueprint (Audit #3: Full-Scale Code, Live API Tests & UI Audit)
**Perspective:** Principal Software Engineer & Senior Product Designer  
**Target Market:** Darbhanga, Bihar (Phase 1 District Launch)  
**Scope:** End-to-End Codebase Re-Audit, Live Integration & Type-Check Test Results, Missing Roadmap Features, and Remaining Classy Architectural B2B UI Polish

---

## 1. Executive Summary: Audit #3 Scorecard

Between Audit #2 and Audit #3, major production capabilities were implemented across the monorepo:
- **Database & Financial Fixes:** `CustomerAddress` now has `createdAt`/`updatedAt` timestamps in `schema.prisma`; `POST /customer/orders/:id/cancel` and `PATCH /supplier/orders/:id/status` now zero out `balancePending` on cancelled/rejected orders; `POST /supplier/ledger/settle` and `POST /supplier/payments/manual` both run FIFO order reconciliation excluding `CANCELLED` and `REJECTED` orders; and `PATCH /supplier/orders/:id/status` checks `sp.stockQuantity < item.quantity` before confirming an order.
- **Security, Auth & URL Navigation:** Added `securityPlugin` (`apps/api/src/plugins/security.ts`) with HTTP security headers and sliding-window rate limiting (15 req/min on auth routes, 300 req/min general); `authPlugin` now verifies live `supplier.status === 'ACTIVE'` in the database on every supplier request; `AuthModal.tsx` provides real Customer Login & Registration with a toggleable Demo Sandbox mode (`isDemoMode`); and `useNavigationHistory.ts` syncs portal tabs, subtabs, yard storefronts, cart drawer, and compare modal with URL query parameters (`?tab=...&subtab=...&yard=...&compare=...`) so the Android hardware back button works.
- **Founder / Super-Admin Operations Suite (`AdminPortal.tsx` & `admin/routes.ts`):** Expanded the Admin Portal with 6 tabs (`GMV Ops`, `Orders & Rescue`, `Yards & Dealers`, `Buyers & Udhaar`, `User Logins`, `Master Catalog`) and new backend endpoints for order rescue, yard inventory inspection, customer editing, Udhaar adjustments, and user credential management.
- **Classy Architectural B2B UI Rollout (~65% Complete):** `Navbar.tsx`, `CartDrawer.tsx`, `CompareModal.tsx`, `AuthModal.tsx`, `AdminPortal.tsx`, and the main tables of `SupplierPortal.tsx` (Spreadsheet-grade Inventory & Passbook Udhaar tables) have been upgraded to the warm stone (`#FAF9F6` / `stone-*`), `font-mono tabular-nums`, and crisp `rounded-xl` design language, plus a `@media print` stylesheet for 1-page Delivery Challans.

However, **our full-scale verification suite (`pnpm type-check`, `pnpm build`, and a 22-endpoint live Fastify `app.inject()` test runner) uncovered 3 compiler errors, 3 live HTTP 500/400 runtime bugs in the new Admin endpoints, 4 financial/stock edge-case flaws, and remaining legacy UI sections.**

---

## 2. Full-Scale Test Execution Report (`type-check`, `build` & Live API Suite)

### 2.1 Monorepo Build & TypeScript Verification (`pnpm type-check` & `pnpm build`)

| Check | Target Package | Status | Details / Failures |
| :--- | :--- | :--- | :--- |
| **`tsc --noEmit`** | `@klink/shared-types` | ✅ **PASS** | 0 errors |
| **`tsc --noEmit`** | `@klink/database` | ✅ **PASS** | Prisma client v6.19.3 generated cleanly |
| **`tsc --noEmit`** | `@klink/web` | ✅ **PASS** | 0 errors (`dist/assets/index.js` built at 465 KB / 104 KB gzip) |
| **`tsc --noEmit`** | `@klink/api` | ❌ **FAIL (3 Errors)** | 1. `src/modules/admin/routes.ts(799,20): error TS2353: 'createdAt' does not exist in type 'PaymentRecordOrderByWithRelationInput'` (`PaymentRecord` uses `recordedAt`).<br>2. `src/modules/supplier/routes.ts(694,13): error TS7034: Variable 'orderItemsData' implicitly has type 'any[]'`.<br>3. `src/modules/supplier/routes.ts(828,23): error TS7005: Variable 'orderItemsData' implicitly has an 'any[]' type`. |

### 2.2 Live Fastify `app.inject()` API Integration Test Results (22 Endpoints Tested)

We executed an automated integration test suite against `buildApp()` with live database queries across Public, Customer, Supplier, and Admin JWT sessions:

- **19 / 22 Endpoints Passed (`200 OK`)** with sub-5ms response times (`GET /health`, `POST /auth/login`, `GET /geo/districts`, `GET /catalog/categories`, `GET /catalog/master-products`, `GET /marketplace/suppliers`, `GET /marketplace/compare/:id`, `GET /customer/orders`, `GET /customer/addresses`, `GET /supplier/dashboard`, `GET /supplier/products`, `GET /supplier/orders`, `GET /supplier/deliveries`, `GET /supplier/ledger`, `GET /supplier/customers`, `GET /supplier/vehicles`, `GET /admin/metrics`, `GET /admin/suppliers`, `GET /admin/users`, `GET /admin/customers`).
- **3 Live Endpoints Failed at Runtime:**

| Failing Endpoint | HTTP Status | Exact Error Thrown | Root Cause & Exact Fix |
| :--- | :--- | :--- | :--- |
| **`GET /api/v1/admin/payments`** | **500 Internal Server Error** | `PrismaClientValidationError: Unknown argument createdAt` in `fastify.prisma.paymentRecord.findMany()` | **Root Cause:** `apps/api/src/modules/admin/routes.ts` (line 799) orders by `orderBy: { createdAt: 'desc' }`, but `model PaymentRecord` in `schema.prisma` (line 228) defines `recordedAt`, not `createdAt`.<br>**Fix:** Change line 799 of `admin/routes.ts` to `orderBy: { recordedAt: 'desc' }`. |
| **`PATCH /api/v1/admin/supplier-products/:id`** | **500 Internal Server Error** | `PrismaClientValidationError: Unknown argument deliveryFee` in `fastify.prisma.supplierProduct.update()` | **Root Cause:** When an Admin edits a yard's product in `AdminPortal.tsx` (line 434), it sends `deliveryFee`, and `admin/routes.ts` (lines 318–334) validates `deliveryFee: z.number().optional()` and passes `request.body` straight into `prisma.supplierProduct.update({ data })`. However, the Prisma column on `SupplierProduct` is named **`deliveryCharge`** (`schema.prisma` line 139)!<br>**Fix:** Map `deliveryCharge: data.deliveryFee ?? data.deliveryCharge` (and delete `deliveryFee`) before calling `prisma.supplierProduct.update()`, and fix `AdminPortal.tsx` line 421 (`prod.deliveryCharge` instead of `prod.deliveryFee`). |
| **`PATCH /api/v1/admin/orders/:id`** | **400 Bad Request** | `FST_ERR_VALIDATION: body/paymentStatus Invalid enum value. Expected 'PENDING' \| 'PARTIAL' \| 'PAID' \| 'OVERDUE', received 'PARTIALLY_PAID'` | **Root Cause:** Across the database and `packages/shared-types/src/order.ts`, `PaymentStatusEnum` is `['PENDING', 'PARTIALLY_PAID', 'PAID', 'UDHAAR']`. However, `admin/routes.ts` (line 409) defines `paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'])`. Whenever an Admin clicks "Fix / Rescue Order" on a `PARTIALLY_PAID` or `UDHAAR` order and clicks Save, the request fails with HTTP 400!<br>**Fix:** Replace the inline enum in `admin/routes.ts` line 409 (and the `<select>` options in `AdminPortal.tsx`) with `PaymentStatusEnum` (`'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'UDHAAR'`). |

---

## 3. Deep Logic, Financial & Data Integrity Bugs Found in Audit #3

Even when requests return `200 OK`, our code audit uncovered **5 logic bugs** in the newly added Admin and Supplier workflows:

### 3.1 Silent Field Drop in Admin Customer Edit (`AdminPortal.tsx` ↔ `admin/routes.ts`)
- **Where:** `apps/web/src/views/AdminPortal.tsx` (lines 450, 461) and `apps/api/src/modules/admin/routes.ts` (line 696).
- **What happens:**
  1. `GET /api/v1/admin/customers` returns `district: { id, name }` (not `districtId`).
  2. When Admin opens the Edit Customer modal (`handleOpenEditCustomer`), `setEditCustDistrictId(cust.districtId || '')` always evaluates to `''` instead of `cust.district?.id`.
  3. On save (`handleSaveCustomer`), `AdminPortal.tsx` sends `{ fullName, phone, districtId: editCustDistrictId }`, whereas `PATCH /admin/customers/:id` in `admin/routes.ts` expects `defaultDistrictId` in its Zod schema. Zod silently strips `districtId`, so **editing a customer's district in the Admin Portal never saves to the database!**
- **Fix:** Accept both `defaultDistrictId` and `districtId` in `PATCH /admin/customers/:id` (mapping `defaultDistrictId: data.defaultDistrictId || data.districtId`), and initialize `setEditCustDistrictId(cust.district?.id || cust.defaultDistrictId || '')` in `AdminPortal.tsx`.

### 3.2 Admin "Adjust Udhaar Balance" Gets Wiped Out on Next Transaction (`admin/routes.ts` lines 714–778)
- **Where:** `PATCH /api/v1/admin/customers/:id/balance` in `apps/api/src/modules/admin/routes.ts`.
- **What happens:** This route directly overwrites `customerLedger.outstandingBalance = newBalance` without creating a corresponding `PaymentRecord` or adjusting `Order` records. Because `supplier/routes.ts` uses `recalculateCustomerLedger()` (which recomputes `outstandingBalance = Math.max(0, sum(Order.finalTotal) - sum(PaymentRecord.amount))` from scratch on every order or payment), **the very next time that customer places an order or makes a payment, `recalculateCustomerLedger()` completely erases the Admin's manual balance adjustment!**
- **Fix:** Implement Admin balance adjustments by inserting a compensating `PaymentRecord` (with `paymentMode: 'ADMIN_ADJUSTMENT'` and the audit `reason` in `notes`) or adjusting the underlying unpaid `Order` records inside a transaction, then calling `recalculateCustomerLedger()`.

### 3.3 Admin Order Rescue Inflates Stock When Cancelling `PENDING_APPROVAL` Orders (`admin/routes.ts` lines 425–457)
- **Where:** `PATCH /api/v1/admin/orders/:id` in `apps/api/src/modules/admin/routes.ts`.
- **What happens:**
  - When a customer places an order (`POST /customer/orders`), its initial status is `PENDING_APPROVAL` and **stock is NOT deducted yet** (stock is only deducted when the supplier transitions the order from `PENDING_APPROVAL` → `CONFIRMED`).
  - However, in `PATCH /admin/orders/:id` (line 433), if an Admin changes an order from `PENDING_APPROVAL` (`!isOldDead`) to `CANCELLED` or `REJECTED` (`isNewDead`), the code runs `stockQuantity: { increment: item.quantity }`—**adding phantom stock to the supplier's inventory that was never deducted!**
  - Furthermore, `PATCH /admin/orders/:id` **never calls `recalculateCustomerLedger()`**, so changing an order's `finalTotal`, `balancePending`, or `status` in the Admin Portal leaves `CustomerLedger` out of sync.
- **Fix:** Only restore/deduct stock when transitioning between a stock-reserved state (`['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED']`) and a unreserved state (`['PENDING_APPROVAL', 'CANCELLED', 'REJECTED']`), and always invoke `recalculateCustomerLedger()` at the end of the transaction.

### 3.4 `recalculateCustomerLedger` Prematurely Bills `PENDING_APPROVAL` Orders (`supplier/routes.ts` lines 31–38)
- **Where:** `recalculateCustomerLedger` in `apps/api/src/modules/supplier/routes.ts` (line 35) and `admin/routes.ts` (line 842).
- **What happens:** `orderSum` aggregates `where: { supplierId, customerId, status: { notIn: ['CANCELLED', 'REJECTED'] } }`. Because `PENDING_APPROVAL` is not in `['CANCELLED', 'REJECTED']`, **an unapproved customer order immediately increases the customer's `totalPurchased` and `outstandingBalance` Udhaar debt before the dealer has even accepted the order!**
- **Fix:** Exclude `'PENDING_APPROVAL'` from `orderSum` (`status: { notIn: ['PENDING_APPROVAL', 'CANCELLED', 'REJECTED'] }`) so only dealer-accepted orders (`CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `COMPLETED`) count toward a customer's ledger.

### 3.5 Missing Negative-Stock Guard in Manual Orders (`supplier/routes.ts` line 777)
- **Where:** `POST /api/v1/supplier/orders/manual` in `apps/api/src/modules/supplier/routes.ts`.
- **What happens:** While `PATCH /supplier/orders/:id/status` now checks `if (!sp || sp.stockQuantity < item.quantity)` before decrementing stock, `POST /supplier/orders/manual` (line 777) still runs `stockQuantity: { decrement: item.quantity }` without checking available stock, allowing manual counter orders to drive yard inventory negative.

---

## 4. What's Missing Against the Product Roadmap & Production Checklist

Cross-referencing the current codebase against `construction_marketplace_product_roadmap.md` reveals **7 missing product features** that will high-value-add for the Darbhanga launch:

| # | Missing Feature | Roadmap Reference | Current State in Codebase | What Needs to Be Built |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Customer-Side Itemized Khata / Passbook Drawer** | Section 19 & 22 (*"Supplier can open a customer ledger and see all orders and payments"*) | In `SupplierPortal.tsx` (`Udhaar` tab), clicking a customer only lets the supplier click `Settle`—there is no drill-down modal showing the chronological history of orders vs. payments (`PaymentRecord`s) for that customer. | Add `GET /api/v1/supplier/customers/:customerId/statement` (returning chronological orders + payment records) and a **Customer Passbook (Bahi-Khata) Drawer** in `SupplierPortal.tsx` with a 1-click **"Send WhatsApp Payment Reminder"** (`wa.me/91...`) button. |
| **2** | **Admin Payments & Audit Log View** | Section 21 & 29 | `GET /api/v1/admin/payments` and `DELETE /api/v1/admin/payments/:id` exist in `admin/routes.ts` (lines 782–869), **but are completely unused in `AdminPortal.tsx`!** | Fix the `recordedAt` bug on `GET /admin/payments` and wire a **"Payments & Settlements"** section into `AdminPortal.tsx` (`Buyers & Udhaar` or `Overview` tab) so the founder can audit or void erroneous payment entries. |
| **3** | **Admin District Activation & Rollout Controls** | Section 27 (*"Admin can activate districts gradually: Darbhanga → Madhubani → Samastipur → Muzaffarpur"*) | `AdminPortal.tsx` (`Overview` tab) displays active districts, and `POST /api/v1/geo/districts` exists, but there is no UI in `AdminPortal.tsx` to toggle `isActive` on Phase 2 districts (Madhubani, Samastipur, Muzaffarpur) or add a new district. | Add `PATCH /api/v1/geo/districts/:id` (toggle `isActive`) and an interactive **Activate / Pause District** toggle in the `AdminPortal.tsx` District Rollout card. |
| **4** | **Supplier Multi-District Service Area Selector** | Section 3.1 & 25 (*"A supplier may serve multiple districts: ✓ Darbhanga ✓ Madhubani ✓ Samastipur"*) | `SupplierServiceArea` exists in `schema.prisma`, and `GET /supplier/profile` returns `serviceAreas`, but `PATCH /supplier/profile` in `supplier/routes.ts` and the Profile tab in `SupplierPortal.tsx` do not let a supplier check/uncheck which districts they deliver to. | Add `serviceAreaDistrictIds: z.array(z.string()).optional()` to `PATCH /supplier/profile` and render district checkboxes in the Supplier Profile tab. |
| **5** | **Cart Live Price & Stock Re-Validation** | Section 6 & 9 | `cart-context.tsx` stores `unitPrice` and `deliveryCharge` in `localStorage`. If a dealer updates their cement rate or runs out of stock while items sit in a buyer's cart, `CartDrawer.tsx` still displays the stale `localStorage` price. | On `CartDrawer` open, verify live prices/stock from `/marketplace/suppliers/:id/storefront` and sync any updated rates with a subtle notification banner. |
| **6** | **Automated Test Suite (`vitest`)** | Production Engineering Requirement | Currently **0 test files** exist in the repository and no `"test"` script is defined in `package.json`. | Add a `vitest` integration test suite in `apps/api/test/api.test.ts` covering Auth, Marketplace Landed-Cost Comparison, Single-Supplier Order Placement, Stock Reservation/Restoration, FIFO Udhaar Settlement, and Admin Rescue operations. |
| **7** | **Code-Splitting & Bundle Size Optimization** | Section 30 (Mobile-First PWA on 4G) | `apps/web` compiles into a single **465.14 KB** JS bundle (`dist/assets/index-BLwoCCML.js`) because `CustomerMarketplace.tsx` (64 KB), `SupplierPortal.tsx` (157 KB), and `AdminPortal.tsx` (128 KB) are eagerly imported in `App.tsx`. | Use `React.lazy()` + `<Suspense>` in `App.tsx` for `SupplierPortal` and `AdminPortal` so mobile customers in Darbhanga only download a ~140 KB initial bundle. |

---

## 5. Classy UI/UX Audit: Completing the "Architectural B2B" Transformation

Our automated scan of `apps/web/src` shows that `Navbar.tsx`, `CartDrawer.tsx`, `CompareModal.tsx`, `AuthModal.tsx`, and `AdminPortal.tsx` have been cleanly migrated to the **Warm Stone (`#FAF9F6` / `stone-*`), Monospace Tabular Numerals (`font-mono tabular-nums`), and Crisp `rounded-xl`** aesthetic (`0` `font-black` and `0` `rounded-3xl` in those files).

However, **4 files still contain legacy "loud prototype" classes** creating visual jarring when switching views:

| File | Remaining `font-black` | Remaining `rounded-3xl` | Remaining `slate-*` | Specific Sections Still Using Legacy Prototype Styling |
| :--- | :---: | :---: | :---: | :--- |
| **`views/CustomerMarketplace.tsx`** | **28** | **5** | **79** | 1. **Top Segmented Sub-Nav** (`Darbhanga Yards & Depots` vs `My Site Orders` uses `rounded-2xl`, `font-black`, `bg-slate-900`).<br>2. **My Site Orders Tab (`subTab === 'orders'`)**: Order cards still use `rounded-3xl border-slate-200`, `font-black`, pulsing amber badges, and `bg-blue-50/80` emoji banners (`🚜 Assigned Vehicle`).<br>3. **Inside Yard Storefront View (`activeSupplierId !== null`)**: Uses `bg-[#080C14] rounded-3xl` header, `rounded-3xl` product cards, `from-slate-950 via-slate-900 to-indigo-950` floating cart bar, and `from-amber-50 to-orange-50 rounded-3xl` Budget Calculator modal. |
| **`views/SupplierPortal.tsx`** | **25** | **10** | **92** | While the main Dashboard, Inventory table, and Udhaar passbook table are now classy `stone-*`, **all 8 Modals at the bottom of `SupplierPortal.tsx`** (Manual Order, Record Payment, Dispatch Truck, Confirm Delivered, Add Master Product, Edit Rate & Stock, Add/Edit Vehicle) still use `rounded-3xl`, `font-black`, `bg-blue-600`, and `bg-amber-500`! |
| **`components/StorefrontModal.tsx`** | **9** | **1** | **26** | Uses `rounded-3xl`, `bg-gradient-to-br from-[#080C14] via-[#0F172A] to-[#1E293B]`, and `from-amber-500 to-orange-500`. |
| **`components/BottomNav.tsx`** | **1** | **0** | **12** | Admin subtabs use `text-stone-100`, but Customer and Supplier subtabs still use `bg-[#0B0F19]/95`, `text-amber-400 scale-105`, and `text-blue-400 scale-105`. |

### Additional UI/UX Polish Needed Across All Views
1. **Replace 36 Native `window.alert()` / `window.confirm()` Dialogs:**
   - Currently there are **17 `alert`/`confirm` calls in `AdminPortal.tsx`**, **14 in `SupplierPortal.tsx`**, **2 in `CustomerMarketplace.tsx`**, **2 in `CartDrawer.tsx`**, and **1 in `cart-context.tsx`**.
   - Replace these with a unified, non-blocking **Architectural Toast Notification & Confirmation Dialog** component.
2. **Default Production vs. Demo Mode Behavior (`auth-context.tsx` line 53):**
   - Currently `import.meta.env.VITE_DEMO_MODE !== 'false'` defaults `isDemoMode` to `true` when `VITE_DEMO_MODE` is unset. For real production deployment, default `isDemoMode` to `import.meta.env.VITE_DEMO_MODE === 'true'` (opt-in rather than opt-out).

---

## 6. Prioritized Final Launch Action Plan

### Step 1: Fix All Compiler & Runtime API Bugs (Immediate P0)
- [ ] **Fix `GET /api/v1/admin/payments` 500 Crash:** Change `orderBy: { createdAt: 'desc' }` to `orderBy: { recordedAt: 'desc' }` in `apps/api/src/modules/admin/routes.ts` (line 799).
- [ ] **Fix `PATCH /api/v1/admin/supplier-products/:id` 500 Crash:** Map `deliveryFee` to `deliveryCharge` in `admin/routes.ts` (line 327) and fix `prod.deliveryCharge` in `AdminPortal.tsx` (line 421).
- [ ] **Fix `PATCH /api/v1/admin/orders/:id` 400 Validation Error & Stock/Ledger Sync:**
  - Align `paymentStatus` enum to `['PENDING', 'PARTIALLY_PAID', 'PAID', 'UDHAAR']` in `admin/routes.ts` (line 409) and `AdminPortal.tsx`.
  - Only restore stock when cancelling an order that was already `CONFIRMED` / `PREPARING` / `OUT_FOR_DELIVERY` (not `PENDING_APPROVAL`).
  - Call `recalculateCustomerLedger()` inside the `PATCH /admin/orders/:id` transaction.
- [ ] **Fix `PATCH /api/v1/admin/customers/:id` & `/balance`:**
  - Map `districtId` to `defaultDistrictId` in `admin/routes.ts` (line 696) and initialize `editCustDistrictId` from `cust.district?.id` in `AdminPortal.tsx`.
  - Record an audit `PaymentRecord` when adjusting customer balance in `PATCH /admin/customers/:id/balance` so `recalculateCustomerLedger()` preserves the adjustment.
- [ ] **Fix `recalculateCustomerLedger` & Manual Order Stock Check (`supplier/routes.ts`):**
  - Exclude `PENDING_APPROVAL` from `orderSum` in `recalculateCustomerLedger`.
  - Enforce `stockQuantity >= item.quantity` in `POST /supplier/orders/manual` and add explicit type annotations to `orderItemsData: any[] = []` so `pnpm type-check` passes with 0 errors.

### Step 2: Complete the Classy Architectural B2B UI Unification
- [ ] **Finish Styling Migration in `CustomerMarketplace.tsx`, `SupplierPortal.tsx` (Modals), `BottomNav.tsx`, and `StorefrontModal.tsx`:** Eliminate the remaining 63 `font-black`, 16 `rounded-3xl`, and 209 `slate-*` classes so every view and modal shares the cohesive `#FAF9F6` / `stone-900` / `font-mono tabular-nums` aesthetic.
- [ ] **Code-Split Portals in `App.tsx`:** Wrap `SupplierPortal` and `AdminPortal` in `React.lazy()` + `<Suspense>` to cut initial customer JS bundle size by >60%.

### Step 3: Add Automated Integration Tests & Missing Roadmap Polish
- [ ] **Add Vitest API Integration Test Suite (`apps/api/src/__tests__/api.test.ts`):** Automate the 22+ endpoint and financial ledger assertions via `pnpm test`.
- [ ] **Wire Customer Khata Statement Drawer & Admin Payments / District Activation UI:** Expose `/admin/payments` and district activation toggles in `AdminPortal.tsx`, and add a Customer Passbook Statement modal in `SupplierPortal.tsx`.
