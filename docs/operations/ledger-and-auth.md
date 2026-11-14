# Ledger reconciliation and shared authentication limits

Authentication writes use shared PostgreSQL counters: 60 requests per client IP per minute and 15 per phone/account per minute. Counter keys are HMACs, not raw phone numbers/IPs. Atomic UPSERTs prevent cross-instance overshoot. Expired windows reset using database time; bounded cleanup removes old rows. Storage failure returns 503 rather than allowing unlimited attempts. Vercel's ingress-overwritten x-vercel-forwarded-for header is used only when VERCEL=1; other hosts use Fastify's configured client address. GET session checks do not spend authentication-write quotas.

Apply versioned migrations before deploying this release. The added AuthRateLimit and LedgerReconciliation tables contain shared quotas and the audit history of balance repairs. Do not copy production credentials into source or command-line arguments.

Ledgers are derived caches: accepted CONFIRMED/PREPARING/OUT_FOR_DELIVERY/DELIVERED/COMPLETED orders contribute purchases; actual PaymentRecord rows contribute received payments. Pending quotes do not contribute purchases. Reconciliation covers missing as well as existing ledgers, holds supplier locks, and preserves source orders/payments. Every changed cache has an audit snapshot; repeating a repair is a no-op when sources haven't changed.

Preview using the repository's private DATABASE_URL environment:

    cd apps/api
    node --import tsx scripts/reconcile-ledgers.ts

After reviewing sources and authorizing the repair:

    LEDGER_RECONCILIATION_REASON='Operator-approved reason' node --import tsx scripts/reconcile-ledgers.ts --apply

Reconciliation does not manufacture missing receipts from an order's amountPaid field. For real business records, resolve missing receipt evidence or opening balances with the operator before applying. Do not use balance edits to claim money was collected. Customer checkout only submits a payment preference; full payment remains due until the yard records a receipt.
