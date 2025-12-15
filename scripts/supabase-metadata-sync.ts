#!/usr/bin/env tsx
/**
 * Supabase Metadata Sync — CONT_06 Integration
 * 
 * This script synchronizes metadata between local mock data and Supabase.
 * It uses the Supabase MCP tools when available, or provides SQL for manual execution.
 * 
 * USAGE:
 *   pnpm supabase:metadata:seed     # Seed metadata to Supabase
 *   pnpm supabase:metadata:export   # Export SQL for manual execution
 * 
 * @see CONT_06_SchemaAndTypeGovernance.md
 */

// ============================================================================
// TYPES
// ============================================================================

interface MetadataField {
  canonicalKey: string;
  label: string;
  description?: string;
  domain: string;
  module: string;
  entityUrn: string;
  dataType: string;
  format?: string;
  nullable?: boolean;
}

// ============================================================================
// MOCK METADATA — Aligned with metadata-studio schema
// ============================================================================

const SEED_METADATA: MetadataField[] = [
  // KERNEL DOMAIN
  { canonicalKey: 'id', label: 'Tenant ID', description: 'Unique identifier for the tenant (UUID)', domain: 'kernel', module: 'iam', entityUrn: 'kernel.tenants', dataType: 'uuid' },
  { canonicalKey: 'name', label: 'Tenant Name', description: 'Name of the tenant organization', domain: 'kernel', module: 'iam', entityUrn: 'kernel.tenants', dataType: 'text' },
  { canonicalKey: 'status', label: 'Tenant Status', description: 'Current status (ACTIVE, SUSPENDED, PENDING)', domain: 'kernel', module: 'iam', entityUrn: 'kernel.tenants', dataType: 'text' },
  { canonicalKey: 'created_at', label: 'Created At', description: 'Timestamp when tenant was created', domain: 'kernel', module: 'iam', entityUrn: 'kernel.tenants', dataType: 'timestamptz' },
  { canonicalKey: 'updated_at', label: 'Updated At', description: 'Timestamp when tenant was last updated', domain: 'kernel', module: 'iam', entityUrn: 'kernel.tenants', dataType: 'timestamptz' },
  
  { canonicalKey: 'id', label: 'User ID', description: 'Unique identifier for the user (UUID)', domain: 'kernel', module: 'iam', entityUrn: 'kernel.users', dataType: 'uuid' },
  { canonicalKey: 'tenant_id', label: 'Tenant ID', description: 'Reference to tenant', domain: 'kernel', module: 'iam', entityUrn: 'kernel.users', dataType: 'uuid' },
  { canonicalKey: 'email', label: 'Email', description: 'User email address', domain: 'kernel', module: 'iam', entityUrn: 'kernel.users', dataType: 'text' },
  { canonicalKey: 'name', label: 'Name', description: 'User display name', domain: 'kernel', module: 'iam', entityUrn: 'kernel.users', dataType: 'text' },
  { canonicalKey: 'password_hash', label: 'Password Hash', description: 'Hashed password', domain: 'kernel', module: 'iam', entityUrn: 'kernel.users', dataType: 'text', nullable: true },
  { canonicalKey: 'created_at', label: 'Created At', description: 'Timestamp when user was created', domain: 'kernel', module: 'iam', entityUrn: 'kernel.users', dataType: 'timestamptz' },
  { canonicalKey: 'updated_at', label: 'Updated At', description: 'Timestamp when user was last updated', domain: 'kernel', module: 'iam', entityUrn: 'kernel.users', dataType: 'timestamptz' },

  // FINANCE DOMAIN
  { canonicalKey: 'id', label: 'Journal ID', description: 'Unique identifier for journal entry', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_entries', dataType: 'uuid' },
  { canonicalKey: 'tenant_id', label: 'Tenant ID', description: 'Reference to tenant for multi-tenancy', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_entries', dataType: 'uuid' },
  { canonicalKey: 'journal_date', label: 'Journal Date', description: 'Date of the journal entry', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_entries', dataType: 'date' },
  { canonicalKey: 'description', label: 'Description', description: 'Journal entry description', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_entries', dataType: 'text' },
  { canonicalKey: 'status', label: 'Status', description: 'Journal entry status (DRAFT, POSTED, REVERSED)', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_entries', dataType: 'text' },
  { canonicalKey: 'created_at', label: 'Created At', description: 'Timestamp when entry was created', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_entries', dataType: 'timestamptz' },
  { canonicalKey: 'updated_at', label: 'Updated At', description: 'Timestamp when entry was last updated', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_entries', dataType: 'timestamptz' },
  { canonicalKey: 'posted_at', label: 'Posted At', description: 'Timestamp when entry was posted', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_entries', dataType: 'timestamptz', nullable: true },

  { canonicalKey: 'id', label: 'Line ID', description: 'Unique identifier for journal line', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_lines', dataType: 'uuid' },
  { canonicalKey: 'tenant_id', label: 'Tenant ID', description: 'Reference to tenant for multi-tenancy', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_lines', dataType: 'uuid' },
  { canonicalKey: 'journal_id', label: 'Journal ID', description: 'Reference to parent journal entry', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_lines', dataType: 'uuid' },
  { canonicalKey: 'account_code', label: 'Account Code', description: 'GL account code', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_lines', dataType: 'text' },
  { canonicalKey: 'debit_amount', label: 'Debit Amount', description: 'Debit amount (null if credit)', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_lines', dataType: 'decimal', nullable: true },
  { canonicalKey: 'credit_amount', label: 'Credit Amount', description: 'Credit amount (null if debit)', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_lines', dataType: 'decimal', nullable: true },
  { canonicalKey: 'created_at', label: 'Created At', description: 'Timestamp when line was created', domain: 'finance', module: 'gl', entityUrn: 'finance.journal_lines', dataType: 'timestamptz' },

  { canonicalKey: 'id', label: 'Account ID', description: 'Unique identifier for GL account', domain: 'finance', module: 'gl', entityUrn: 'finance.accounts', dataType: 'uuid' },
  { canonicalKey: 'tenant_id', label: 'Tenant ID', description: 'Reference to tenant for multi-tenancy', domain: 'finance', module: 'gl', entityUrn: 'finance.accounts', dataType: 'uuid' },
  { canonicalKey: 'account_code', label: 'Account Code', description: 'Unique account code', domain: 'finance', module: 'gl', entityUrn: 'finance.accounts', dataType: 'text' },
  { canonicalKey: 'account_name', label: 'Account Name', description: 'Display name of the account', domain: 'finance', module: 'gl', entityUrn: 'finance.accounts', dataType: 'text' },
  { canonicalKey: 'account_type', label: 'Account Type', description: 'Type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)', domain: 'finance', module: 'gl', entityUrn: 'finance.accounts', dataType: 'text' },
  { canonicalKey: 'is_active', label: 'Is Active', description: 'Whether account is active', domain: 'finance', module: 'gl', entityUrn: 'finance.accounts', dataType: 'boolean' },
  { canonicalKey: 'created_at', label: 'Created At', description: 'Timestamp when account was created', domain: 'finance', module: 'gl', entityUrn: 'finance.accounts', dataType: 'timestamptz' },
];

// ============================================================================
// SQL GENERATORS
// ============================================================================

/**
 * Generate CREATE TABLE SQL for mdm_global_metadata
 */
function generateCreateTableSQL(): string {
  return `-- Metadata Studio Schema for Supabase
-- Run this migration to create the mdm_global_metadata table

-- Create Standard Pack table first (for foreign key)
CREATE TABLE IF NOT EXISTS mdm_standard_pack (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id TEXT NOT NULL UNIQUE,
  pack_name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  standard_body TEXT NOT NULL,
  standard_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL
);

-- Create Global Metadata table
CREATE TABLE IF NOT EXISTS mdm_global_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  canonical_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  module TEXT NOT NULL,
  entity_urn TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'tier3',
  standard_pack_id TEXT REFERENCES mdm_standard_pack(pack_id),
  data_type TEXT NOT NULL,
  format TEXT,
  aliases_raw TEXT,
  owner_id TEXT NOT NULL,
  steward_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  is_draft BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  
  -- Unique constraint per tenant
  CONSTRAINT mdm_global_metadata_tenant_canonical_key_uq UNIQUE (tenant_id, canonical_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS mdm_global_metadata_domain_module_idx 
  ON mdm_global_metadata(tenant_id, domain, module);
CREATE INDEX IF NOT EXISTS mdm_global_metadata_tier_status_idx 
  ON mdm_global_metadata(tenant_id, tier, status);
CREATE INDEX IF NOT EXISTS mdm_global_metadata_entity_urn_idx 
  ON mdm_global_metadata(tenant_id, entity_urn);
`;
}

/**
 * Generate INSERT SQL for seeding metadata
 */
function generateSeedSQL(tenantId: string): string {
  const inserts = SEED_METADATA.map((field, index) => {
    const escapedDescription = field.description?.replace(/'/g, "''") ?? '';
    return `  ('${tenantId}', '${field.entityUrn}.${field.canonicalKey}', '${field.label}', '${escapedDescription}', '${field.domain}', '${field.module}', '${field.entityUrn}', 'tier3', '${field.dataType}', 'system', 'system', 'system', 'system')`;
  });

  return `-- Seed metadata for tenant: ${tenantId}
-- Generated: ${new Date().toISOString()}

INSERT INTO mdm_global_metadata (
  tenant_id, canonical_key, label, description, 
  domain, module, entity_urn, tier, data_type,
  owner_id, steward_id, created_by, updated_by
) VALUES
${inserts.join(',\n')}
ON CONFLICT (tenant_id, canonical_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  domain = EXCLUDED.domain,
  module = EXCLUDED.module,
  entity_urn = EXCLUDED.entity_urn,
  data_type = EXCLUDED.data_type,
  updated_at = NOW(),
  updated_by = EXCLUDED.updated_by;
`;
}

/**
 * Generate SELECT SQL for querying metadata
 */
function generateQuerySQL(tenantId: string): string {
  return `-- Query metadata for type generation
SELECT 
  canonical_key,
  label,
  description,
  domain,
  module,
  entity_urn,
  data_type,
  format
FROM mdm_global_metadata
WHERE tenant_id = '${tenantId}'
  AND status = 'active'
ORDER BY entity_urn, canonical_key;
`;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const action = args[0] ?? 'export';
  
  // Default tenant ID (demo tenant)
  const tenantId = '00000000-0000-0000-0000-000000000001';
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Supabase Metadata Sync — CONT_06 Integration                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  switch (action) {
    case 'create':
      console.log('📋 CREATE TABLE SQL for mdm_global_metadata:');
      console.log('─'.repeat(70));
      console.log(generateCreateTableSQL());
      break;
      
    case 'seed':
      console.log(`📋 SEED SQL for tenant ${tenantId}:`);
      console.log('─'.repeat(70));
      console.log(generateSeedSQL(tenantId));
      break;
      
    case 'query':
      console.log(`📋 QUERY SQL for tenant ${tenantId}:`);
      console.log('─'.repeat(70));
      console.log(generateQuerySQL(tenantId));
      break;
      
    case 'export':
    default:
      console.log('📦 Exporting all SQL statements...');
      console.log();
      console.log('═'.repeat(70));
      console.log('STEP 1: CREATE TABLES');
      console.log('═'.repeat(70));
      console.log(generateCreateTableSQL());
      console.log();
      console.log('═'.repeat(70));
      console.log('STEP 2: SEED METADATA');
      console.log('═'.repeat(70));
      console.log(generateSeedSQL(tenantId));
      console.log();
      console.log('═'.repeat(70));
      console.log('STEP 3: QUERY METADATA');
      console.log('═'.repeat(70));
      console.log(generateQuerySQL(tenantId));
      break;
  }
  
  console.log();
  console.log('─'.repeat(70));
  console.log('💡 To run these in Supabase:');
  console.log('   1. Copy the SQL above');
  console.log('   2. Use Supabase MCP: user-supabase-apply_migration or user-supabase-execute_sql');
  console.log('   3. Or paste into Supabase Dashboard SQL Editor');
  console.log();
}

main();
