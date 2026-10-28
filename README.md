# KLINK — Construction Materials Marketplace
> Multi-Tenant Digital Marketplace & Supplier Operating System starting in **Darbhanga, Bihar**.

Built directly following the [construction_marketplace_product_roadmap.md](./construction_marketplace_product_roadmap.md).

---

## 🏗️ Architecture Overview

The project is structured as a high-performance **pnpm Monorepo**:

```text
KLINK/
├── apps/
│   ├── api/                      # Fastify v5 (TypeScript) Backend REST API
│   │   ├── src/
│   │   │   ├── plugins/          # Prisma, JWT Authentication, Swagger OpenAPI
│   │   │   ├── modules/
│   │   │   │   ├── auth/         # Multi-role authentication (Admin, Supplier, Customer)
│   │   │   │   ├── geo/          # States, Districts (Darbhanga launch + rollout)
│   │   │   │   ├── catalog/      # Categories, Brands, Master Product Catalog
│   │   │   │   ├── marketplace/  # Supplier comparison matrix & public storefronts
│   │   │   │   ├── customer/     # Single-supplier cart, site orders & tracking
│   │   │   │   ├── supplier/     # Shop OS: Dashboard, Inventory, Orders & Udhaar Ledger
│   │   │   │   └── admin/        # Platform GMV, supplier verification & catalog ops
│   │   │   ├── app.ts            # Fastify application setup
│   │   │   └── server.ts         # Server entrypoint (Port 4000)
│   │
│   └── web/                      # Responsive Mobile & Desktop Web App (PWA)
│       ├── src/
│       │   ├── components/       # Top Navbar, Mobile BottomNav, CartDrawer, CompareModal
│       │   ├── views/
│       │   │   ├── CustomerMarketplace.tsx  # District shop, category pills, compare, site orders
│       │   │   ├── SupplierPortal.tsx       # Partner tenant dashboard, inventory, orders, Udhaar ledger
│       │   │   └── AdminPortal.tsx          # Central ops, GMV metrics, supplier verification
│       │   ├── lib/              # API client, Auth Context, Cart Context, District Context
│       │   └── index.css         # Tailwind CSS styling
│       └── vite.config.ts        # Vite Dev Server (Port 3000) with API proxy
│
├── packages/
│   ├── shared-types/             # Zod validation schemas & TypeScript DTOs
│   ├── database/                 # Prisma ORM models, SQLite dev db & Darbhanga seeds
│   └── tsconfig/                 # Shared base TypeScript configurations
│
├── construction_marketplace_product_roadmap.md
└── package.json
```

---

## 🚀 Running the Project

### Prerequisites
- Node.js >= 20
- pnpm >= 10

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Database Setup & Seed (Darbhanga initial data)
```bash
# Push schema & seed Darbhanga suppliers, materials, pricing and sample order
pnpm db:push
pnpm db:seed
```

### 3. Build All Packages
```bash
pnpm build
```

### 4. Start Development Servers
```bash
# Start both Fastify API (port 4000) and Web App (port 3000)
pnpm dev

# Or individually:
pnpm dev:api   # Fastify API at http://localhost:4000 (Docs: /documentation)
pnpm dev:web   # Web App at http://localhost:3000
```

---

## 👥 Demo Personas & Credentials

The database comes pre-seeded with realistic Darbhanga data. You can switch personas with **1 click** in the top navigation bar or log in with:

| Role | Name / Business | Phone | Password | Key Capabilities |
|---|---|---|---|---|
| **Customer** | Ravi Kumar | `9123456789` | `customer123` | Browse Darbhanga materials, compare supplier quotes, place single-supplier site order, track delivery timeline |
| **Supplier 1** | Gupta Building Materials (Donar Chowk) | `9876543210` | `supplier123` | Accept/reject orders, live stock & price overrides, record offline payments, track customer Udhaar ledger |
| **Supplier 2** | Singh Traders & Steels (Laheriasarai) | `9876543211` | `supplier123` | Alternate local dealer for real-time price & delivery comparison |
| **Admin** | Central Platform Admin | `9999999999` | `admin123` | Marketplace GMV & volume stats, supplier verification queue, district rollout controls |
| **New Onboarded Supplier** | Maa Ambe Cement & Steels | `9811122233` | `newStorePass2026!` | Onboarded by admin, changed initial temp password `klink@2026` |

---

## 🎯 Key Roadmap Features Implemented

1. **Admin Supplier Onboarding & Credential Generation (Roadmap Section 25 & 26)**:
   - Admin can add any local dealer with Shop Name, Owner, Phone, Service District, Address, GSTIN, Logo/Photo, Description, and initial temporary password.
   - Generates a shareable WhatsApp credentials slip for the dealer.
2. **Forced Password Change on First Login**:
   - Newly created suppliers receive `mustChangePassword: true`.
   - On first login, a modal automatically locks the screen until the dealer sets their permanent confidential password.
3. **Supplier Store Profile & Catalog Setup**:
   - Suppliers can update their address, store logo/photo, GSTIN, and store description.
   - 1-click catalog addition to add master products (UltraTech, Tata Tiscon, Balu, Gitti, etc.) with custom selling prices and stock.
4. **District-Based Discovery (Roadmap Section 3 & 7.2)**:
   - Initial launch market: **Darbhanga, Bihar** with multi-district architecture ready for Samastipur, Madhubani, Muzaffarpur, Patna.
2. **Phase 1 Categories (Roadmap Section 4)**:
   - Cement (UltraTech, ACC, Ambuja)
   - Steel / Sariya / TMT (Tata Tiscon, Balmukund)
   - Sand / Balu (Koel River Sand)
   - Aggregate / Gitti (Pakur 20mm Blue Metal)
   - Bricks / Eent (Red Clay Kiln Brick)
   - Blocks (AAC 6-inch)
3. **Master Catalog Model (Roadmap Section 5 & 28)**:
   - Platform controls standard specifications and brands; suppliers set their own price, stock, min order, and delivery fees.
4. **Product Comparison Matrix (Roadmap Section 7.5)**:
   - Interactive quantity calculator showing side-by-side quotes for UltraTech Cement, Sariya, etc., comparing unit prices, stock, and total delivered costs between local suppliers.
5. **One Cart = One Supplier (Roadmap Section 9)**:
   - Single-supplier order model with user warning if adding items from another supplier.
6. **Order Confirmation & Lifecycle (Roadmap Section 11–13)**:
   - `Placed` -> `Pending Supplier Approval` -> `Confirmed` -> `Preparing` -> `Out for Delivery` -> `Delivered`.
   - Supplier accept/reject workflow with customizable reasons.
7. **Offline Payments & Udhaar Ledger (Roadmap Section 20–22)**:
   - Manual payment recording for Cash, UPI direct, Cheque, and Udhaar.
   - Customer-wise receivables ledger tracking total purchases, total paid, and outstanding balances.
8. **Mobile-First & PC-Friendly (Roadmap Section 30)**:
   - Responsive mobile navigation bar on mobile phones, multi-column desktop layout with tables on PC.
   - PWA manifest and mobile viewport configurations.
