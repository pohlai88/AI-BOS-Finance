-- Migration: Add missing columns to mdm_approval (if needed)
-- Run this ONLY if the VERIFY-mdm-approval-schema.sql script reports missing columns
--
-- Usage:
--   psql -d your_database -f ADD-approval-columns-if-missing.sql
--
-- Note: This uses ADD COLUMN IF NOT EXISTS, so it's safe to run multiple times

BEGIN;

-- Add missing columns (if any)
ALTER TABLE mdm_approval
    ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL,
    ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS entity_id UUID,
    ADD COLUMN IF NOT EXISTS entity_key TEXT,
    ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS lane TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL,
    ADD COLUMN IF NOT EXISTS current_state JSONB,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS decision_reason TEXT,
    ADD COLUMN IF NOT EXISTS requested_by TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS decided_by TEXT,
    ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS required_role TEXT; -- nullable for flexibility

-- Add recommended indexes (if missing)
CREATE INDEX IF NOT EXISTS mdm_approval_tenant_status_idx
  ON mdm_approval (tenant_id, status);

CREATE INDEX IF NOT EXISTS mdm_approval_tenant_entity_idx
  ON mdm_approval (tenant_id, entity_type, entity_key);

-- Verify the table structure
DO $$
BEGIN
    RAISE NOTICE '✅ Migration complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Run VERIFY-mdm-approval-schema.sql again to confirm all columns are present.';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. pnpm db:generate  (sync Drizzle types)';
    RAISE NOTICE '  2. pnpm dev           (start server with event system)';
    RAISE NOTICE '  3. Test approval flow (see EVENT-SYSTEM-INTEGRATION-COMPLETE.md)';
END $$;

COMMIT;

