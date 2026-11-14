ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT, ADD COLUMN "requestHash" TEXT;
CREATE UNIQUE INDEX "Order_supplierId_idempotencyKey_key" ON "Order"("supplierId", "idempotencyKey");
