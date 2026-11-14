# Vercel + Neon launch runbook

## Existing deployment

The current project is https://klink-flame.vercel.app, built from the repository root. Keep root `vercel.json`: it builds the unified `apps/web` frontend and routes `/api/*` and `/health` to the Fastify serverless handler. Do not change the root directory to a frontend package on this existing project.

Use Node 22 in Vercel. The lockfile pins pnpm 10.17.1. Install with `corepack pnpm install --frozen-lockfile`; build with `pnpm build`; output `apps/web/dist`. Builds do not apply database migrations.

Set these **server-only** Vercel production environment variables:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon pooled PostgreSQL URL, with TLS required (`sslmode=require`) |
| `JWT_SECRET` | New independently generated secret, at least 32 characters (`openssl rand -hex 32`) |
| `ALLOWED_ORIGINS` | Exact HTTPS origins: start with `https://klink-flame.vercel.app`; add actual custom/portal domains, comma-separated |
| `TRUST_PROXY` | `1` for the controlled Vercel ingress; leave `0` for a directly exposed standalone API |
| `NODE_ENV` | `production` |

Never prefix database, signing or storage credentials with `VITE_`. The unified app uses relative `/api/v1`; leave `VITE_API_URL` unset. Disable `VITE_DEMO_MODE`. Preview deployments must use a separate Neon branch and signing secret, never the live database. Add preview origins explicitly if needed; arbitrary `*.vercel.app` origins are not trusted.

Storage is optional. If required, configure `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `NEON_STORAGE_BUCKET`; limit bucket CORS to actual upload origins and validate a real upload/download before enabling that feature.

## Existing database: baseline, then migrate

1. Schedule a maintenance window. Take a Neon restore point/branch and verify recovery on a separate branch. Reconcile historical stock, orders, payments and ledgers: earlier application code allowed negative stock, duplicate reservations, mismatched payments and direct balance overrides. The new code cannot infer the correct historical business balances.
2. Use the Neon **direct**, TLS-enabled connection string in a secure operator shell for migrations. Do not paste it into chat or commit it. Clone the release commit and install dependencies.
3. Confirm whether `_prisma_migrations` already exists. If it does, inspect its contents; do not blindly resolve migrations. For an installation previously managed by `db push`, compare the live schema against `packages/database/prisma/migrations/202611110001_baseline/migration.sql`. Resolve any drift on the staging Neon branch first.
4. Only if all baseline objects already match, record the baseline as applied (this does not execute its CREATE statements):

   ```sh
   pnpm --filter @klink/database exec prisma migrate resolve --applied 202611110001_baseline
   pnpm db:migrate
   pnpm --filter @klink/database exec prisma migrate status
   ```

   Do **not** mark the session-version or payment-idempotency migrations applied unless their exact changes already exist. Migration 002 adds session versions; migration 003 adds nullable payment retry metadata and a unique key. Migration 004 adds nullable order retry metadata. All preserve existing records. Every old JWT lacks the session version and will be rejected: all users must sign in again.
5. Deploy the release after migrations succeed. Confirm the new health route returns JSON, not frontend HTML.

For a brand-new empty database, just run `pnpm db:migrate`. Bootstrap the initial admin using securely supplied `ADMIN_PHONE` (10 digits) and `ADMIN_PASSWORD` (16+ characters, max 72 UTF-8 bytes), then `pnpm db:bootstrap`. It refuses to overwrite an existing admin and creates no demo accounts or financial records. Existing deployments should reset known sample passwords through the verified admin workflow, remove unnecessary demo users safely, and rotate any previously exposed secrets.

## Separate portal deployments (optional)

Create additional Vercel projects rooted at `apps/marketplace-web`, `apps/partner-web`, and `apps/admin-web`. Build shared types first, then that app; output `dist`. Each local `vercel.json` proxies `/api/*` to `https://klink-flame.vercel.app/api/*` and serves SPA routes. Keep `VITE_API_URL` unset for that same-origin proxy, or explicitly use the API URL and add the frontend origin to `ALLOWED_ORIGINS`. Test proxy routing from the deployed portal.

## Required production checks

- `GET /api/live`: 200 liveness JSON. `GET /api/health` and `/health`: 200 readiness JSON, or 503 when the database is unavailable. API responses use `Cache-Control: no-store`.
- Add Vercel WAF/distributed rate limits for **all** `/api/v1/auth/*` endpoints and request-volume monitoring. The built-in in-memory limiter is per instance and cannot enforce a deployment-wide quota.
- Set error/uptime alerts, configure log retention and access, and verify Neon recovery/retention matches the business's RPO/RTO. Perform a restore drill; a configured backup is not a verified recovery.
- Verify login, forced password changes, suspended suppliers, customer ordering, acceptance, dispatch, delivery, cash/UPI recording, and ledger totals on staging. Try a second supplier to confirm tenant isolation.
- Confirm real districts, catalog, prices, delivery/service areas and stock with the business. Agree cancellation/refund handling and support contact details before taking orders.
- Confirm privacy notice, terms, delivery/refund policy and business contact details with the operator before public onboarding. These business/legal decisions are not established by the repository.

## Behavior changes operators must understand

Existing customers must first place an order with a new yard before its staff can attach manual orders by phone. Suppliers see delivery addresses from their own orders only.

Walk-in profiles can no longer be claimed by typing their phone number. Support must verify ownership out of band before an administrator resets credentials. Automated OTP recovery is not implemented.

Passwords resets revoke existing sessions. Temporary-password sessions may only read `/auth/me` or change password; they cannot access business endpoints. Sessions expire after 12 hours.

Pending orders do not reserve stock; acceptance/direct dispatch does. Status transitions cannot skip fulfillment steps or revive terminal orders. Paid orders cannot be cancelled without a reconciled refund workflow. Udhaar means credit owed, not cash received. Payment requests require `Idempotency-Key` (8–128 characters): reuse the same key and body on transport retry, use a new key for a genuinely new receipt. The frontend retains pending keys in session storage across transport retries and reloads; API consumers must supply them. Reusing a key for a changed body returns 409.

Admin order editing is limited to delivery/contact details. Raw financial overrides and payment deletion return 409 and their UI controls are disabled. An audited refund/adjustment workflow is not implemented; do not use fake payments to correct historical balances.

Monetary writes are rounded to two decimals, but legacy database fields remain floating-point for compatibility. Large-scale accounting requirements may warrant a separately rehearsed Decimal migration. Reconcile legacy balances before launch.

## Rollback

Keep the prior Vercel deployment available, but do not route users back to known-vulnerable authentication/accounting code as a routine rollback. Prefer maintenance mode and a forward fix. The additive schema migrations are compatible with older reads, but restoring old code reopens the fixed defects. Do not drop migration columns to roll back the UI. If data recovery is required, restore to a separate Neon branch and verify before switching connections.
