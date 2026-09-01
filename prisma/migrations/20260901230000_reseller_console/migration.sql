-- Reseller console: demo telemetry on Business, plus the three models that
-- belong to whoever runs the deployment rather than to a tenant.
--
-- Every column added here is nullable or has a default, so this applies
-- cleanly to a database that already holds businesses and bookings.

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "industryKey" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "lastViewedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProspectStatus') THEN
    CREATE TYPE "ProspectStatus" AS ENUM ('NUEVO', 'CONTACTADO', 'DEMO_ENVIADA', 'INTERESADO', 'NEGOCIACION', 'GANADO', 'PERDIDO');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Prospect" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "sector" TEXT,
    "status" "ProspectStatus" NOT NULL DEFAULT 'NUEVO',
    "source" TEXT,
    "value" DECIMAL(12,2),
    "notes" TEXT,
    "businessId" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DemoShare" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "prospectId" TEXT,
    "token" TEXT NOT NULL,
    "label" TEXT,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "lastOpenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemoShare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "Prospect_status_idx" ON "Prospect"("status");
CREATE INDEX IF NOT EXISTS "Prospect_businessId_idx" ON "Prospect"("businessId");
CREATE UNIQUE INDEX IF NOT EXISTS "DemoShare_token_key" ON "DemoShare"("token");
CREATE INDEX IF NOT EXISTS "DemoShare_businessId_idx" ON "DemoShare"("businessId");
CREATE INDEX IF NOT EXISTS "DemoShare_prospectId_idx" ON "DemoShare"("prospectId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Prospect_businessId_fkey') THEN
    ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DemoShare_businessId_fkey') THEN
    ALTER TABLE "DemoShare" ADD CONSTRAINT "DemoShare_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DemoShare_prospectId_fkey') THEN
    ALTER TABLE "DemoShare" ADD CONSTRAINT "DemoShare_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
