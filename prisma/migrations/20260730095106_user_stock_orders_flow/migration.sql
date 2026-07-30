-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mustSetPassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 0;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "OrderFulfillment" AS ENUM ('PENDING', 'QUOTE', 'SALE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT 'Mexico';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "municipality" TEXT NOT NULL DEFAULT '';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment" "OrderFulfillment" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "stockDeducted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "orders" ALTER COLUMN "city" SET DEFAULT '';

CREATE INDEX IF NOT EXISTS "orders_fulfillment_idx" ON "orders"("fulfillment");
