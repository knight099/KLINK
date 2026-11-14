# Release verification

Baseline: `e026d61` on `main`. The original build and TypeScript checks passed, but the initial 12 integration regression tests all failed against a disposable PostgreSQL database.

The patch adds tests for live session validation/revocation, walk-in takeover prevention, tenant access, fulfillment transitions, stock races, payment races, Udhaar semantics, overpayments, pending-order stock, availability, administrative bypasses and idempotent payments/manual orders. Frontend helper tests simulate a lost payment response across all four applications. A positive customer-order lifecycle checks checkout through payment.

An independent review identified client retry-key lifetime, manual phone lookup, manual-order retries, fractional-paise upfront payments and delivery vehicle side effects. These were addressed with regression coverage. Authenticated unified-app routing was then corrected following browser inspection.

Verified commands:

- `corepack pnpm install --frozen-lockfile`
- `pnpm build` and `pnpm type-check`
- `DATABASE_URL=<local klink_test database> pnpm test`
- `pnpm audit --audit-level=high` (zero advisories at verification)
- `prisma migrate deploy` on a fresh database and an existing, baselined local database
- `git diff --check`

Browser smoke: Chromium with local seeded data, customer/supplier/admin login, marketplace rendering and both role dashboards, with no page exceptions. Production homepage and district API were checked read-only. Production writes, Vercel settings, recovery and business acceptance are not claimed as verified.

See the PR for final test count and the private operator report for live blockers.
