# KLINK

Construction materials marketplace and supplier operating system for Darbhanga, Bihar.

- `apps/web`: unified application used by the existing root Vercel deployment, https://klink-flame.vercel.app
- `apps/marketplace-web`, `apps/partner-web`, `apps/admin-web`: separate customer, supplier and admin applications
- `apps/api`: Fastify API, shared by every frontend
- `packages/database`: Prisma PostgreSQL schema, migrations, local demo seed and production bootstrap
- `packages/shared-types`: Zod request validation and DTOs

## Local setup

Use Node 22 LTS (22–24 supported), Corepack and the pinned pnpm version. Start a local PostgreSQL 16 database. Copy `.env.example` to `.env`, set `DATABASE_URL`, and generate a private signing key with `openssl rand -hex 32` for `JWT_SECRET`.

```sh
corepack pnpm install --frozen-lockfile
# Export DATABASE_URL securely in your shell for Prisma CLI commands.
# Prisma CLI does not read the repository root .env from the package directory.
corepack pnpm db:migrate
corepack pnpm build
corepack pnpm dev:api
# In another terminal:
corepack pnpm dev:web
```

The standalone API loads the root `.env`; frontend dev servers use the API on port 4000. The unified web app uses port 3000. For the separate apps use `dev:market`, `dev:partner`, and `dev:admin` (ports 3000, 3001, 3002).

For disposable local demo data only, run `ALLOW_DEMO_SEED=true pnpm db:seed` with `NODE_ENV=development` and a local database. The seed is **not a production initialization command**. It creates known-password sample users and business records. The demo UI stays off unless explicitly enabled with `VITE_DEMO_MODE=true`.

## Checks

```sh
pnpm build
pnpm type-check
# A dedicated local PostgreSQL database whose name begins with klink_test:
DATABASE_URL=postgresql://klink:klink_test_only@localhost:5432/klink_test pnpm db:migrate
DATABASE_URL=postgresql://klink:klink_test_only@localhost:5432/klink_test pnpm test
pnpm audit --audit-level=high
```

CI runs clean migrations, builds, type checks, integration tests and the dependency audit. Tests create fixtures in a dedicated database and must never run on production. The frontend build targets Chrome/Edge 107+, Firefox 104+ and Safari 16+.

## Deployment

Read [the Vercel/Neon launch runbook](docs/LAUNCH.md) before applying migrations to an existing Neon database. Existing installations need a verified migration baseline. **Do not run `db push`, reset, or demo seeding against production.**

[Readiness findings and remaining release gates](PRODUCTION_LAUNCH_READINESS_PLAN.md) distinguish verified repository changes from live infrastructure work. Building successfully is not evidence that production credentials, backups or business records are ready.
