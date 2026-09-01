-- Multi-tenancy: one deployment serves many businesses.
--
-- This runs against databases that already hold a single business's live
-- data, so every tenant-owned table gets its businessId in three steps —
-- add the column nullable, backfill it, then enforce NOT NULL. Adding it as
-- NOT NULL outright fails on any table that already has rows.

-- DropIndex
DROP INDEX "Customer_email_key";

-- DropIndex
DROP INDEX "Service_active_idx";

-- DropIndex
DROP INDEX "Staff_active_idx";

-- DropIndex
DROP INDEX "TimeOff_date_idx";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "listed" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "timezone" SET DEFAULT 'America/Bogota',
ALTER COLUMN "currency" SET DEFAULT 'COP';

-- AlterTable: add the tenant key as nullable so existing rows survive.
ALTER TABLE "User" ADD COLUMN     "businessId" TEXT;
ALTER TABLE "Staff" ADD COLUMN     "businessId" TEXT;
ALTER TABLE "Service" ADD COLUMN     "businessId" TEXT;
ALTER TABLE "TimeOff" ADD COLUMN     "businessId" TEXT;
ALTER TABLE "Customer" ADD COLUMN     "businessId" TEXT;
ALTER TABLE "Booking" ADD COLUMN     "businessId" TEXT;

-- Backfill. Before this migration the app enforced exactly one Business per
-- deployment, so every existing row belongs to the oldest (and only) one.
-- On a fresh database this matches nothing and does nothing.
UPDATE "User"     SET "businessId" = (SELECT "id" FROM "Business" ORDER BY "createdAt" ASC LIMIT 1) WHERE "businessId" IS NULL;
UPDATE "Staff"    SET "businessId" = (SELECT "id" FROM "Business" ORDER BY "createdAt" ASC LIMIT 1) WHERE "businessId" IS NULL;
UPDATE "Service"  SET "businessId" = (SELECT "id" FROM "Business" ORDER BY "createdAt" ASC LIMIT 1) WHERE "businessId" IS NULL;
UPDATE "TimeOff"  SET "businessId" = (SELECT "id" FROM "Business" ORDER BY "createdAt" ASC LIMIT 1) WHERE "businessId" IS NULL;
UPDATE "Customer" SET "businessId" = (SELECT "id" FROM "Business" ORDER BY "createdAt" ASC LIMIT 1) WHERE "businessId" IS NULL;
UPDATE "Booking"  SET "businessId" = (SELECT "id" FROM "Business" ORDER BY "createdAt" ASC LIMIT 1) WHERE "businessId" IS NULL;

-- Anything still NULL here had no Business at all to belong to, which the
-- old app could never render. Nothing legitimate can be in this state; the
-- deletes only fire on already-broken data, and they run child-first so the
-- foreign keys below hold.
DELETE FROM "Booking"      WHERE "businessId" IS NULL;
DELETE FROM "Customer"     WHERE "businessId" IS NULL;
DELETE FROM "TimeOff"      WHERE "businessId" IS NULL;
DELETE FROM "Availability" WHERE "staffId" IN (SELECT "id" FROM "Staff" WHERE "businessId" IS NULL);
DELETE FROM "ServiceStaff" WHERE "staffId" IN (SELECT "id" FROM "Staff" WHERE "businessId" IS NULL)
                              OR "serviceId" IN (SELECT "id" FROM "Service" WHERE "businessId" IS NULL);
DELETE FROM "Service"      WHERE "businessId" IS NULL;
DELETE FROM "Staff"        WHERE "businessId" IS NULL;
DELETE FROM "User"         WHERE "businessId" IS NULL;

-- Now the column can carry its real constraint.
ALTER TABLE "User"     ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Staff"    ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Service"  ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "TimeOff"  ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Booking"  ALTER COLUMN "businessId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Booking_businessId_startsAt_idx" ON "Booking"("businessId", "startsAt");

-- CreateIndex
CREATE INDEX "Business_listed_idx" ON "Business"("listed");

-- CreateIndex
CREATE INDEX "Customer_businessId_idx" ON "Customer"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessId_email_key" ON "Customer"("businessId", "email");

-- CreateIndex
CREATE INDEX "Service_businessId_active_idx" ON "Service"("businessId", "active");

-- CreateIndex
CREATE INDEX "Staff_businessId_active_idx" ON "Staff"("businessId", "active");

-- CreateIndex
CREATE INDEX "TimeOff_businessId_date_idx" ON "TimeOff"("businessId", "date");

-- CreateIndex
CREATE INDEX "User_businessId_idx" ON "User"("businessId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOff" ADD CONSTRAINT "TimeOff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
