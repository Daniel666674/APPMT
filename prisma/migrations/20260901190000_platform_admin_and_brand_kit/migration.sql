-- Reseller-level access plus a deeper brand kit.
--
-- Every column here is nullable or defaulted, so this applies cleanly to a
-- deployment that already has live data.

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "city" TEXT,
ADD COLUMN     "cornerStyle" TEXT NOT NULL DEFAULT 'soft',
ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- The person who set this deployment up runs it, so their account becomes the
-- platform admin: the one login that can reach every business. Only fires when
-- nobody holds that access yet, so it never overrides a later decision.
UPDATE "User"
   SET "isPlatformAdmin" = true
 WHERE "id" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC, "id" ASC LIMIT 1)
   AND NOT EXISTS (SELECT 1 FROM "User" WHERE "isPlatformAdmin" = true);

-- This deployment is sold in Colombia; currency is no longer user-editable.
UPDATE "Business" SET "currency" = 'COP' WHERE "currency" <> 'COP';
