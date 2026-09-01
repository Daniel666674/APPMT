-- The platform admin belongs to no business.
--
-- Requiring a businessId on every user forced the person who runs the
-- deployment to invent an agenda before they could have a login, which is
-- backwards: they run all of them. Making it nullable lets the superadmin
-- account exist on its own, and a business owner's login keeps its
-- businessId — which is exactly what pins them to their own agenda.

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "businessId" DROP NOT NULL;

-- Detach the platform admin from whichever business it happened to be
-- created under, so it is no longer counted as that business's owner.
UPDATE "User" SET "businessId" = NULL WHERE "isPlatformAdmin" = true;
