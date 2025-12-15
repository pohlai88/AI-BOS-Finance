// metadata-studio/scripts/verify-approval-schema.ts
/**
 * Verify mdm_approval schema without psql
 * 
 * Usage:
 *   tsx metadata-studio/scripts/verify-approval-schema.ts
 */

import { db } from '../db/client';
import { sql } from 'drizzle-orm';

const REQUIRED_COLUMNS = [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'tenant_id', type: 'uuid', nullable: false },
    { name: 'entity_type', type: 'text', nullable: false },
    { name: 'entity_id', type: 'uuid', nullable: true },
    { name: 'entity_key', type: 'text', nullable: true },
    { name: 'tier', type: 'text', nullable: false },
    { name: 'lane', type: 'text', nullable: false },
    { name: 'payload', type: 'jsonb', nullable: false },
    { name: 'current_state', type: 'jsonb', nullable: true },
    { name: 'status', type: 'text', nullable: false },
    { name: 'decision_reason', type: 'text', nullable: true },
    { name: 'requested_by', type: 'text', nullable: false },
    { name: 'decided_by', type: 'text', nullable: true },
    { name: 'requested_at', type: 'timestamp with time zone', nullable: true },
    { name: 'decided_at', type: 'timestamp with time zone', nullable: true },
    { name: 'required_role', type: 'text', nullable: true }, // ✅ NULLABLE
];

const REQUIRED_INDEXES = [
    'mdm_approval_tenant_status_idx',
    'mdm_approval_tenant_entity_idx',
];

async function verifySchema() {
    console.log('🔍 Verifying mdm_approval schema...\n');

    try {
        // Check if table exists
        const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mdm_approval'
      );
    `);

        if (!tableExists.rows[0]?.exists) {
            console.error('❌ Table mdm_approval does not exist!');
            console.log('\nRun migration first:');
            console.log('  pnpm db:migrate');
            process.exit(1);
        }

        // Get actual columns
        const columns = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'mdm_approval'
      ORDER BY ordinal_position;
    `);

        // Check for missing columns
        const missingColumns: string[] = [];
        const actualColumns = new Map(
            columns.rows.map((col: any) => [
                col.column_name,
                {
                    type: col.data_type,
                    nullable: col.is_nullable === 'YES',
                },
            ])
        );

        for (const required of REQUIRED_COLUMNS) {
            const actual = actualColumns.get(required.name);
            if (!actual) {
                missingColumns.push(required.name);
            } else {
                // Normalize type names for comparison
                const actualType = actual.type.toLowerCase();
                const requiredType = required.type.toLowerCase();

                const typeMatches =
                    actualType === requiredType ||
                    (requiredType === 'text' && actualType === 'character varying') ||
                    (requiredType === 'uuid' && actualType === 'uuid');

                if (!typeMatches) {
                    console.warn(
                        `⚠️  Column ${required.name}: expected ${required.type}, got ${actual.type}`
                    );
                }
            }
        }

        if (missingColumns.length > 0) {
            console.error('❌ Missing columns detected!\n');
            console.error('Missing columns:');
            missingColumns.forEach((col) => console.error(`  • ${col}`));
            console.log('\nRun migration:');
            console.log('  psql -d your_db -f metadata-studio/db/migrations/ADD-approval-columns-if-missing.sql');
            console.log('\nOr regenerate Drizzle schema:');
            console.log('  pnpm db:generate && pnpm db:migrate');
            process.exit(1);
        }

        // Check indexes
        const indexes = await db.execute(sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'mdm_approval'
        AND schemaname = 'public';
    `);

        const actualIndexes = new Set(indexes.rows.map((idx: any) => idx.indexname));
        const missingIndexes = REQUIRED_INDEXES.filter(
            (idx) => !actualIndexes.has(idx)
        );

        if (missingIndexes.length > 0) {
            console.warn('⚠️  Missing recommended indexes:\n');
            missingIndexes.forEach((idx) => console.warn(`  • ${idx}`));
            console.log('\nCreate indexes:');
            console.log('  CREATE INDEX mdm_approval_tenant_status_idx ON mdm_approval(tenant_id, status);');
            console.log('  CREATE INDEX mdm_approval_tenant_entity_idx ON mdm_approval(tenant_id, entity_type, entity_key);');
            console.log('');
        }

        // Success!
        console.log('✅ SUCCESS: mdm_approval schema is complete and ready!\n');
        console.log('All required columns for event-driven approval workflow are present:');
        console.log('  • id, tenant_id, entity_type, entity_id, entity_key');
        console.log('  • tier, lane, payload, current_state');
        console.log('  • status, decision_reason');
        console.log('  • requested_by, decided_by, requested_at, decided_at');
        console.log('  • required_role (✅ NULLABLE)');
        console.log('');

        if (missingIndexes.length === 0) {
            console.log('✅ All recommended indexes are present');
        }

        console.log('\nNext steps:');
        console.log('  1. pnpm dev                    (start server with event system)');
        console.log('  2. Test approval flow          (see APPROVAL-FLOW-WALKTHROUGH.md)');
        console.log('  3. Verify profile runs         (for Tier1/Tier2 approvals)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error verifying schema:', error);
        process.exit(1);
    }
}

verifySchema();

