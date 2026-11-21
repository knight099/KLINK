CREATE TABLE "YardQuoteChange" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "YardQuoteChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "YardQuoteChange_createdAt_idx" ON "YardQuoteChange"("createdAt");
