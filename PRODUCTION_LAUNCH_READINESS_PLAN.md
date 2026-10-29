# KLINK — Production Launch Readiness & Execution Plan
**Perspective:** Principal Software Engineer & Senior Product Designer  
**Target Market:** Darbhanga, Bihar (Phase 1 District Launch)  
**Scope:** Whole-Application Production Hardening, Financial & Stock Logic Integrity, Architectural Stone UI Unification, and 3-Application Monorepo Separation.

---

## 1. Executive Summary & Active Status Scorecard

The core infrastructure layer has been migrated from ephemeral SQLite to **managed Neon PostgreSQL** (`ep-autumn-unit-b4ytvkbo`), **Neon Object Storage** (S3-compatible bucket `assets`), and **Neon Auth** (JWKS verification), with live production deployed at **https://klink-flame.vercel.app** on branch `main`.

| Pillar | Readiness | Active Status | Verified Deliverables |
| :--- | :---: | :---: | :--- |
| **1. Cloud & Database Infrastructure** | **100%** | **COMPLETE** | Managed Neon PostgreSQL, Auth & Object Storage live on Vercel (`main`). |
| **2. Build & TypeScript Hygiene** | **100%** | **COMPLETE** | `pnpm -r run build` & `pnpm -r run type-check` pass with 0 errors. |
| **3. Financial, Stock & Business Logic** | **100%** | **COMPLETE** | Stock deduction on dispatch, vehicle status auto-toggle, and Udhaar ledger accuracy verified. |
| **4. Security & Multi-Tenancy** | **100%** | **COMPLETE** | Fastify `trustProxy: true`, production CORS origin restrictions, and production clean demo state. |
| **5. Classy Architectural B2B Design** | **100%** | **COMPLETE** | Warm Stone palette (`#FAF9F6`, `stone-900`, tabular-nums, crisp `rounded-xl`) unified across all portals. |
| **6. High-Impact Product Flows** | **100%** | **COMPLETE** | Bahi-Khata Statement Drawer + 1-Tap WhatsApp, Admin Payments Audit table & District activation toggles. |
| **7. 3-Application Separation** | **Planning** | **UPCOMING** | Splitting into `@klink/marketplace-web`, `@klink/partner-web`, and `@klink/admin-web`. |

---

## 2. Completed Production Hardening Highlights

### Phase 1: Business Logic, Inventory & Financial Ledger Integrity (COMPLETED)
- [x] **BL-01: Direct Order Dispatch Stock Deduction (`supplier/routes.ts`):**
  - Deducts stock if an order transitions directly from `PENDING_APPROVAL` to `OUT_FOR_DELIVERY` in `POST /supplier/orders/:id/dispatch`.
- [x] **BL-02: Vehicle Fleet Status Auto-Toggle (`supplier/routes.ts`):**
  - Automatically updates `SupplierVehicle.status` to `'ON_TRIP'` on dispatch and back to `'AVAILABLE'` on delivery completion.
- [x] **BL-03: Exclude `PENDING_APPROVAL` from Udhaar Ledger (`supplier/routes.ts` & `admin/routes.ts`):**
  - In `recalculateCustomerLedger()`, excluded `PENDING_APPROVAL` orders from `orderSum` so unapproved orders never inflate debt prematurely.
- [x] **BL-04: Admin Order Rescue Stock & Ledger Sync (`admin/routes.ts`):**
  - In `PATCH /admin/orders/:id`, does not increment stock when cancelling an order that was still in `PENDING_APPROVAL`.
  - Triggers `recalculateCustomerLedger()` after admin order modifications.
- [x] **BL-05: Persist Admin Udhaar Adjustments (`admin/routes.ts`):**
  - In `PATCH /admin/customers/:id/balance`, generates an audit `PaymentRecord` entry with mode `'UDHAAR'` so subsequent recalculations preserve admin balance adjustments.
- [x] **BL-06: Admin Customer District & Product Delivery Charge Parameter Mapping (`admin/routes.ts`):**
  - Maps `districtId` → `defaultDistrictId` in `PATCH /admin/customers/:id`.
  - Maps `deliveryFee` → `deliveryCharge` in `PATCH /admin/supplier-products/:id`.
  - Aligned `paymentStatus` Zod schema to `['PENDING', 'PARTIALLY_PAID', 'PAID', 'UDHAAR']`.
- [x] **BL-07: Flexible Supplier Payment Recording (`packages/shared-types`):**
  - Made `customerId` optional in `RecordPaymentInputSchema` when `orderId` is provided.

---

### Phase 2: Security & Multi-Tenant Boundary Hardening (COMPLETED)
- [x] **SEC-01: Enable `trustProxy: true` in Fastify (`apps/api/src/app.ts`):**
  - Configured proxy trusting for accurate client IP rate limiting behind Vercel / Cloudflare edge proxies.
- [x] **SEC-02: Production CORS Restrictions (`apps/api/src/app.ts`):**
  - Restricted CORS origins to `klink-flame.vercel.app`, `*.klink.in`, and localhost in development.
- [x] **SEC-03: Production Demo Mode Inversion (`apps/web/src/lib/auth-context.tsx`):**
  - Production defaults to clean state without pre-seeded mock sessions unless `VITE_DEMO_MODE === 'true'`.

---

### Phase 3: Missing High-Impact Feature Flows (COMPLETED)
- [x] **Customer Bahi-Khata Statement Drawer (`SupplierPortal.tsx` & `CustomerMarketplace.tsx`):**
  - Chronological transaction statement drawer listing every order debit (with item breakdowns) and payment credit with date, mode, balance, and a 1-Tap WhatsApp Payment Reminder button (`wa.me/91...`).
  - Buyer-side Udhaar balance ribbon in `CustomerMarketplace.tsx` (`My Site Orders` tab) displaying Total Billed, Total Paid, and Net Pending Dues.
- [x] **Admin Payments Audit Table & District Activation Toggles (`AdminPortal.tsx`):**
  - Live Payments Audit subtab with search, filtering, and deletion of fraudulent/erroneous entries.
  - Interactive District `isActive` toggle buttons in Admin Overview to control rollout across Bihar districts.
- [x] **Supplier Multi-District Delivery Coverage Checkboxes (`SupplierPortal.tsx` Profile Tab):**
  - Allows suppliers to configure and toggle authorized delivery districts (`serviceDistrictIds`).

---

### Phase 4: UI/UX Redesign to Classy Architectural B2B (COMPLETED)
- [x] **`CustomerMarketplace.tsx` Redesign:**
  - Standardized cards, yard storefront, modals, and tabs to `rounded-xl` and `stone-*` palette.
- [x] **`SupplierPortal.tsx` Modals Redesign:**
  - Standardized all 8 modals (Manual Order, Record Payment, Dispatch Truck, Delivery Completion, Add SKU, Edit Rate, Vehicle Fleet) to `stone-900` / `#FAF9F6` crisp `rounded-xl` styling.
- [x] **`StorefrontModal.tsx` & `BottomNav.tsx` Redesign:**
  - Modernized with Warm Stone `#141413` palette and added Payments Audit navigation for admin.

---

## 3. Active Upcoming Milestone: 3-Application Monorepo Separation

- [ ] **Extract Shared Packages (`packages/ui` & `packages/api-client`)**
  - Move shared components (Navbar, BottomNav, AuthModal, CartDrawer, DistrictContext) into `@klink/ui`.
- [ ] **Scaffold `apps/partner-web` (Port 3001) for Dealer Yards**
  - Dedicated lightweight portal bundle for material suppliers and yard managers.
- [ ] **Scaffold `apps/admin-web` (Port 3002) for Founder Control Tower**
  - Dedicated administrative dashboard bundle for platform founders and district operators.
- [ ] **Convert `apps/web` into pure `apps/marketplace-web` (Port 3000) for Buyers**
  - Optimized consumer-facing construction material catalog and live order tracking.
