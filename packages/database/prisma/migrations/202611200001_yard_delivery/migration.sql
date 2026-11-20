ALTER TABLE "Supplier"
  ADD COLUMN "deliveryPincodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "deliveryMinHours" INTEGER,
  ADD COLUMN "deliveryMaxHours" INTEGER;

ALTER TABLE "Order" ADD COLUMN "deliverySchedule" JSONB;
