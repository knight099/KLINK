# Production readiness implementation plan

**Goal:** Repair verified launch blockers in the existing marketplace, supplier and admin applications.
**Architecture:** Keep Fastify, Prisma PostgreSQL, React/Vite and Vercel/Neon. Make production configuration explicit and enforce invariants in the API. Work on an isolated checkout/branch; do not touch live data or deploy.
**Scope:** User request to inspect and make the existing repository launch ready. No redesign or new commercial integrations.

## Tasks

- [x] Establish baseline build/type checks and a local PostgreSQL regression harness.
- [x] Authentication: test account takeover, forced-password bypass, revoked/stale sessions and missing production secrets; enforce live identity and session versions, reject unverified walk-in claims.
- [x] Transactions: test invalid transitions, concurrent stock/payment writes, tenant access and Udhaar semantics; serialize supplier financial mutations and validate transitions/stock/payments.
- [x] Operations: explicit origins/proxy trust, truthful readiness, safe error responses, migration/bootstrap commands, CI and environment examples; harden serverless initialization and static caching.
- [x] Run full checks, integration and browser smoke tests, dependency audit, fresh code review; document actual evidence and outstanding external launch requirements.

## Review focus

Concurrent accept/cancel/dispatch; duplicate payment requests; expired/reset credentials; cross-tenant customer lookups; clean install and existing-database migration paths.

## Decisions

- Preserve the current hosting architecture absent a different user preference.
- Disable phone-only walk-in claiming until identity verification is available; administrator-assisted recovery remains possible.
- Retain the existing numeric database representation for compatibility, round monetary writes to paise, and document historical reconciliation before launch.
- Live deployment, production secrets, backups and a restore drill require the operator's environment; local verification does not certify them.

## Outcome

Repository work verified with build/type checks, real PostgreSQL regressions, dependency audit and Chromium smoke checks. Independent review findings were fixed, including client/manual-order retry semantics and phone-based tenant access. Live metadata was inspected with the supplied Neon credential; production data changes remain gated on owner classification, verified recovery and Vercel configuration. No production schema/data write or deployment has occurred.
