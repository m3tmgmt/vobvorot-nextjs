-- Add reserved stock field to ProductSku table
ALTER TABLE "product_skus" ADD COLUMN IF NOT EXISTS "reservedStock" INTEGER DEFAULT 0;

-- Create StockReservation table
CREATE TABLE IF NOT EXISTS "stock_reservations" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderId" TEXT,
    "sessionId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for orderId
CREATE UNIQUE INDEX IF NOT EXISTS "stock_reservations_orderId_key" ON "stock_reservations"("orderId");

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "stock_reservations_skuId_idx" ON "stock_reservations"("skuId");
CREATE INDEX IF NOT EXISTS "stock_reservations_expiresAt_idx" ON "stock_reservations"("expiresAt");
CREATE INDEX IF NOT EXISTS "stock_reservations_sessionId_idx" ON "stock_reservations"("sessionId");

-- Add foreign key constraints
ALTER TABLE "stock_reservations" 
ADD CONSTRAINT IF NOT EXISTS "stock_reservations_skuId_fkey" 
FOREIGN KEY ("skuId") REFERENCES "product_skus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_reservations" 
ADD CONSTRAINT IF NOT EXISTS "stock_reservations_orderId_fkey" 
FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;