ALTER TABLE "PaymentRecord" ADD COLUMN "idempotencyKey" TEXT, ADD COLUMN "requestHash" TEXT;
CREATE UNIQUE INDEX "PaymentRecord_supplierId_idempotencyKey_key" ON "PaymentRecord"("supplierId", "idempotencyKey");
