-- VERIFICATION SCRIPT FOR mdm_approval SCHEMA
-- This script verifies that your existing mdm_approval table has all required columns
-- for the event-driven approval workflow.

-- Run this to check if your schema is ready:
-- psql -d your_database -f VERIFY-mdm-approval-schema.sql

DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    column_name TEXT;
BEGIN
    -- Check for required columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'id'
    ) THEN
        missing_columns := array_append(missing_columns, 'id UUID PRIMARY KEY');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'tenant_id'
    ) THEN
        missing_columns := array_append(missing_columns, 'tenant_id UUID NOT NULL');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'entity_type'
    ) THEN
        missing_columns := array_append(missing_columns, 'entity_type TEXT NOT NULL');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'entity_id'
    ) THEN
        missing_columns := array_append(missing_columns, 'entity_id UUID');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'entity_key'
    ) THEN
        missing_columns := array_append(missing_columns, 'entity_key TEXT');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'tier'
    ) THEN
        missing_columns := array_append(missing_columns, 'tier TEXT NOT NULL');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'lane'
    ) THEN
        missing_columns := array_append(missing_columns, 'lane TEXT NOT NULL');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'payload'
    ) THEN
        missing_columns := array_append(missing_columns, 'payload JSONB NOT NULL');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'current_state'
    ) THEN
        missing_columns := array_append(missing_columns, 'current_state JSONB');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'status'
    ) THEN
        missing_columns := array_append(missing_columns, 'status TEXT NOT NULL DEFAULT ''pending''');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'decision_reason'
    ) THEN
        missing_columns := array_append(missing_columns, 'decision_reason TEXT');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'requested_by'
    ) THEN
        missing_columns := array_append(missing_columns, 'requested_by TEXT NOT NULL');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'decided_by'
    ) THEN
        missing_columns := array_append(missing_columns, 'decided_by TEXT');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'requested_at'
    ) THEN
        missing_columns := array_append(missing_columns, 'requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'decided_at'
    ) THEN
        missing_columns := array_append(missing_columns, 'decided_at TIMESTAMP WITH TIME ZONE');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mdm_approval' AND column_name = 'required_role'
    ) THEN
        missing_columns := array_append(missing_columns, 'required_role TEXT');
    END IF;

    -- Report results
    IF array_length(missing_columns, 1) IS NULL THEN
        RAISE NOTICE '✅ SUCCESS: mdm_approval schema is complete and ready!';
        RAISE NOTICE '';
        RAISE NOTICE 'All required columns for event-driven approval workflow are present:';
        RAISE NOTICE '  • id, tenant_id, entity_type, entity_id, entity_key';
        RAISE NOTICE '  • tier, lane, payload, current_state';
        RAISE NOTICE '  • status, decision_reason';
        RAISE NOTICE '  • requested_by, decided_by, requested_at, decided_at';
        RAISE NOTICE '  • required_role';
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps:';
        RAISE NOTICE '  1. Run: pnpm dev';
        RAISE NOTICE '  2. Test approval flow (see EVENT-SYSTEM-INTEGRATION-COMPLETE.md)';
        RAISE NOTICE '  3. Verify profile runs after Tier1/Tier2 approvals';
    ELSE
        RAISE WARNING '⚠️  MISSING COLUMNS DETECTED!';
        RAISE WARNING '';
        RAISE WARNING 'The following columns need to be added to mdm_approval:';
        FOREACH column_name IN ARRAY missing_columns
        LOOP
            RAISE WARNING '  • %', column_name;
        END LOOP;
        RAISE WARNING '';
        RAISE WARNING 'Run: pnpm db:generate && pnpm db:migrate';
    END IF;
END $$;

-- Optional: Check indexes (these improve performance but aren't critical)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'mdm_approval' AND indexname = 'mdm_approval_tenant_status_idx'
    ) THEN
        RAISE NOTICE 'ℹ️  Recommendation: Add index for faster approval queries:';
        RAISE NOTICE '   CREATE INDEX mdm_approval_tenant_status_idx ON mdm_approval(tenant_id, status);';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'mdm_approval' AND indexname = 'mdm_approval_tenant_entity_idx'
    ) THEN
        RAISE NOTICE 'ℹ️  Recommendation: Add index for entity lookups:';
        RAISE NOTICE '   CREATE INDEX mdm_approval_tenant_entity_idx ON mdm_approval(tenant_id, entity_type, entity_key);';
    END IF;
END $$;

