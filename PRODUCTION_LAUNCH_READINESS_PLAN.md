# KLINK launch readiness — evidence, not a blanket certification

The previous “100% production ready” declaration was not supported by behavioral tests. Review of main at `e026d61` reproduced account takeover, session, tenant and financial-integrity failures despite a successful build.

## Repository hardening

- Explicit signing secret; no database-derived or public fallback signing key.
- Live session/role/profile checks, forced password change enforcement, session revocation after resets, and restricted walk-in recovery.
- Exact production origin allowlist, explicit proxy trust, sanitized server errors, private API cache policy, readiness 503 on database failure and safe cold-start initialization.
- Serialized supplier financial mutations, conditional stock reservations, guarded order transitions/cancellation, payment validation, tenant/customer checks and payment retry keys.
- Disabled unsafe raw admin balance overrides/payment deletion. Operator-visible limitations are documented in the runbook.
- Additive Prisma migrations, safe initial-admin bootstrap, guarded demo seed, environment example and CI.
- Patched dependency tree, fresh HTML navigation and restricted static-only service worker caching.

## Validation

See the PR/test results for the exact release checks. Integration tests use local PostgreSQL and exercise the real Fastify API. Both clean-schema migration and existing-schema baselining are rehearsed locally. Live checks of https://klink-flame.vercel.app were read-only; no production database write or deployment is implied by these changes.

## Release gates still requiring the operator's environment

Apply and verify migrations on a staging Neon branch, rotate known/default credentials, reconcile historical business records, configure Vercel environment variables and distributed auth rate limiting, verify backups/restore and alerts, and complete a staging business-flow acceptance test. Confirm business policies and support ownership. Refunds/adjustments and verified self-service phone recovery remain unavailable.

Follow [docs/LAUNCH.md](docs/LAUNCH.md). Do not onboard real users solely because the repository builds or a health check returns 200.
