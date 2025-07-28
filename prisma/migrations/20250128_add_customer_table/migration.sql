-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'VIP', 'BLOCKED');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "telegram_id" TEXT,
    "total_spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "order_count" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_order_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_telegram_id_key" ON "customers"("telegram_id");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_telegram_id_idx" ON "customers"("telegram_id");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- AlterTable: Add customer relationship to orders
ALTER TABLE "orders" ADD COLUMN "customer_id" TEXT;

-- CreateIndex on orders for customer lookup
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" 
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Optional: Create telegram_sessions table for bot state persistence
CREATE TABLE "telegram_sessions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_sessions_key_key" ON "telegram_sessions"("key");

-- CreateIndex
CREATE INDEX "telegram_sessions_key_idx" ON "telegram_sessions"("key");

-- CreateIndex
CREATE INDEX "telegram_sessions_expires_at_idx" ON "telegram_sessions"("expires_at");

-- Data Migration: Extract customers from existing orders
-- This creates customer records from unique email addresses in orders
INSERT INTO "customers" (id, email, name, phone, total_spent, order_count, last_order_date, created_at, updated_at)
SELECT 
    gen_random_uuid()::text as id,
    o.shipping_email as email,
    o.shipping_name as name,
    o.shipping_phone as phone,
    SUM(o.total) as total_spent,
    COUNT(*) as order_count,
    MAX(o.created_at) as last_order_date,
    MIN(o.created_at) as created_at,
    CURRENT_TIMESTAMP as updated_at
FROM "orders" o
WHERE o.shipping_email IS NOT NULL 
    AND o.shipping_email != ''
    AND o.payment_status = 'COMPLETED'
GROUP BY o.shipping_email, o.shipping_name, o.shipping_phone
ON CONFLICT (email) DO NOTHING;

-- Update orders with customer_id based on email match
UPDATE "orders" o
SET customer_id = c.id
FROM "customers" c
WHERE o.shipping_email = c.email
    AND o.customer_id IS NULL;