CREATE TABLE "AuthRateLimit" (
  "key" TEXT PRIMARY KEY,
  "count" INTEGER NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL
);
CREATE INDEX "AuthRateLimit_expiresAt_idx" ON "AuthRateLimit"("expiresAt");
CREATE TABLE "LedgerReconciliation" (
  "id" TEXT PRIMARY KEY,
  "ledgerId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "before" JSONB NOT NULL,
  "after" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
