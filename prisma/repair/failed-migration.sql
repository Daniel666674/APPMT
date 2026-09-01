-- One-time self-repair, run by `npm run build` just before `migrate deploy`.
--
-- The 20260901020000_multi_tenant migration originally added businessId as
-- NOT NULL in a single step. On a deployment that already held a business's
-- data that fails with 23502, and Prisma records the attempt as failed.
-- Prisma then refuses to apply ANY migration (P3009) until a human clears
-- that record — which would mean the fixed migration could never land.
--
-- Prisma rolls each migration back as a whole, so a failed attempt leaves no
-- schema changes behind; marking it rolled back is exactly what
-- `prisma migrate resolve --rolled-back` does, and Prisma then re-applies it.
--
-- This is deliberately narrow and idempotent: it names one migration, only
-- touches a row that is still unfinished, and matches nothing once that
-- migration has applied. It is a no-op on a fresh database and on every
-- deploy after the next one, and can be deleted once every deployment has
-- moved past it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_name = '_prisma_migrations'
  ) THEN
    UPDATE "_prisma_migrations"
       SET "rolled_back_at" = now()
     WHERE "migration_name" = '20260901020000_multi_tenant'
       AND "finished_at" IS NULL
       AND "rolled_back_at" IS NULL;
  END IF;
END $$;
