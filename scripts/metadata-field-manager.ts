#!/usr/bin/env tsx
/**
 * Metadata Field Manager — CONT_06 Schema-First Tool
 * 
 * This script provides the "super-flexible but highest governance" interface
 * for managing the Metadata Registry (mdm_global_metadata).
 * 
 * CAPABILITIES:
 * - List all fields, entities, domains
 * - Add new fields with governance tier validation
 * - Select which fields to include in type generation
 * - Promote/deprecate fields
 * - Validate GRCD rules
 * 
 * USAGE:
 *   pnpm metadata:list              # List all entities and fields
 *   pnpm metadata:add               # Add a new field (interactive)
 *   pnpm metadata:validate          # Validate GRCD rules
 * 
 * @see CONT_06_SchemaAndTypeGovernance.md
 */

// ============================================================================
// TYPES
// ============================================================================

interface MetadataField {
  canonical_key: string;
  label: string;
  description: string | null;
  domain: string;
  module: string;
  entity_urn: string;
  data_type: string;
  tier: string;
  status: string;
  standard_pack_id: string | null;
}

interface Entity {
  entity_urn: string;
  entity_name: string;
  domain: string;
  module: string;
  fields: MetadataField[];
}

// ============================================================================
// GOVERNANCE TIERS
// ============================================================================

const GOVERNANCE_TIERS = {
  tier1: {
    name: 'Constitutional',
    approvalRequired: 'kernel_architect',
    standardPackRequired: true,
    description: 'Core identity fields (tenant_id, user_id)',
  },
  tier2: {
    name: 'Governed',
    approvalRequired: 'metadata_steward',
    standardPackRequired: true,
    description: 'Financial standards (IFRS, GAAP)',
  },
  tier3: {
    name: 'Managed',
    approvalRequired: 'auto (steward+)',
    standardPackRequired: false,
    description: 'Business fields with governance',
  },
  tier4: {
    name: 'Operational',
    approvalRequired: 'auto (admin+)',
    standardPackRequired: false,
    description: 'Local operational fields',
  },
  tier5: {
    name: 'User-defined',
    approvalRequired: 'auto',
    standardPackRequired: false,
    description: 'Custom/temporary fields',
  },
} as const;

// ============================================================================
// DATA TYPES
// ============================================================================

const VALID_DATA_TYPES = [
  'uuid', 'text', 'varchar', 'char',
  'integer', 'int', 'smallint', 'bigint',
  'decimal', 'numeric', 'real', 'double', 'float', 'money',
  'boolean', 'bool',
  'date', 'timestamp', 'timestamptz', 'time',
  'json', 'jsonb',
  'array',
] as const;

// ============================================================================
// MOCK DATA — Would be replaced with Supabase MCP query in production
// ============================================================================

const MOCK_FIELDS: MetadataField[] = [
  // Kernel
  { canonical_key: 'kernel.tenants.id', label: 'Tenant ID', description: 'Primary tenant identifier', domain: 'kernel', module: 'iam', entity_urn: 'kernel.tenants', data_type: 'uuid', tier: 'tier1', status: 'active', standard_pack_id: null },
  { canonical_key: 'kernel.tenants.name', label: 'Tenant Name', description: 'Tenant display name', domain: 'kernel', module: 'iam', entity_urn: 'kernel.tenants', data_type: 'text', tier: 'tier3', status: 'active', standard_pack_id: null },
  { canonical_key: 'kernel.users.id', label: 'User ID', description: 'Primary user identifier', domain: 'kernel', module: 'iam', entity_urn: 'kernel.users', data_type: 'uuid', tier: 'tier1', status: 'active', standard_pack_id: null },
  { canonical_key: 'kernel.users.tenant_id', label: 'Tenant ID', description: 'FK to tenant', domain: 'kernel', module: 'iam', entity_urn: 'kernel.users', data_type: 'uuid', tier: 'tier1', status: 'active', standard_pack_id: null },
  { canonical_key: 'kernel.users.email', label: 'Email', description: 'User email', domain: 'kernel', module: 'iam', entity_urn: 'kernel.users', data_type: 'text', tier: 'tier3', status: 'active', standard_pack_id: null },

  // Finance
  { canonical_key: 'finance.journal_entries.id', label: 'Journal ID', description: 'Journal entry identifier', domain: 'finance', module: 'gl', entity_urn: 'finance.journal_entries', data_type: 'uuid', tier: 'tier3', status: 'active', standard_pack_id: null },
  { canonical_key: 'finance.journal_entries.journal_date', label: 'Journal Date', description: 'Date of journal entry', domain: 'finance', module: 'gl', entity_urn: 'finance.journal_entries', data_type: 'date', tier: 'tier2', status: 'active', standard_pack_id: 'MFRS-101' },
  { canonical_key: 'finance.journal_entries.description', label: 'Description', description: 'Journal description', domain: 'finance', module: 'gl', entity_urn: 'finance.journal_entries', data_type: 'text', tier: 'tier3', status: 'active', standard_pack_id: null },
  { canonical_key: 'finance.journal_lines.debit_amount', label: 'Debit Amount', description: 'Debit side of entry', domain: 'finance', module: 'gl', entity_urn: 'finance.journal_lines', data_type: 'decimal', tier: 'tier2', status: 'active', standard_pack_id: 'MFRS-101' },
  { canonical_key: 'finance.journal_lines.credit_amount', label: 'Credit Amount', description: 'Credit side of entry', domain: 'finance', module: 'gl', entity_urn: 'finance.journal_lines', data_type: 'decimal', tier: 'tier2', status: 'active', standard_pack_id: 'MFRS-101' },
];

// ============================================================================
// FUNCTIONS
// ============================================================================

function groupByEntity(fields: MetadataField[]): Map<string, Entity> {
  const entities = new Map<string, Entity>();

  for (const field of fields) {
    const existing = entities.get(field.entity_urn);
    if (existing) {
      existing.fields.push(field);
    } else {
      entities.set(field.entity_urn, {
        entity_urn: field.entity_urn,
        entity_name: field.entity_urn.split('.').pop() ?? '',
        domain: field.domain,
        module: field.module,
        fields: [field],
      });
    }
  }

  return entities;
}

function validateGRCDRules(fields: MetadataField[]): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const field of fields) {
    const tier = GOVERNANCE_TIERS[field.tier as keyof typeof GOVERNANCE_TIERS];

    // Rule: Tier1/Tier2 require standard_pack_id
    if (tier?.standardPackRequired && !field.standard_pack_id) {
      violations.push(
        `❌ GRCD Violation: ${field.canonical_key} is ${field.tier} but missing standard_pack_id`
      );
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

function printTierSummary(fields: MetadataField[]): void {
  const tierCounts = new Map<string, number>();

  for (const field of fields) {
    tierCounts.set(field.tier, (tierCounts.get(field.tier) ?? 0) + 1);
  }

  console.log('\n📊 Governance Tier Distribution:');
  console.log('─'.repeat(50));

  for (const [tier, info] of Object.entries(GOVERNANCE_TIERS)) {
    const count = tierCounts.get(tier) ?? 0;
    const bar = '█'.repeat(Math.min(count, 20));
    console.log(
      `  ${tier.padEnd(6)} │ ${info.name.padEnd(15)} │ ${String(count).padStart(3)} │ ${bar}`
    );
  }
}

function listEntities(fields: MetadataField[]): void {
  const entities = groupByEntity(fields);

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Metadata Registry — Entity & Field Catalog                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();

  for (const [urn, entity] of entities) {
    console.log(`📦 ${entity.domain}.${entity.entity_name} (${entity.fields.length} fields)`);
    console.log(`   Module: ${entity.module}`);
    console.log('   Fields:');

    for (const field of entity.fields) {
      const tierBadge = field.tier === 'tier1' ? '🔴' :
        field.tier === 'tier2' ? '🟠' :
          field.tier === 'tier3' ? '🟢' : '⚪';
      const packBadge = field.standard_pack_id ? `[${field.standard_pack_id}]` : '';
      const fieldName = field.canonical_key.split('.').pop();
      console.log(
        `     ${tierBadge} ${fieldName?.padEnd(20)} │ ${field.data_type.padEnd(12)} │ ${field.tier} ${packBadge}`
      );
    }
    console.log();
  }

  printTierSummary(fields);

  // Validate
  const validation = validateGRCDRules(fields);
  console.log();
  if (validation.valid) {
    console.log('✅ All GRCD rules satisfied');
  } else {
    console.log('⚠️  GRCD Violations Found:');
    for (const v of validation.violations) {
      console.log(`   ${v}`);
    }
  }
}

function showFlexibilityDemo(): void {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Schema-First Flexibility Demonstration                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();

  console.log('🎯 The "Super-Flexible but Highest Governance" Model:');
  console.log();
  console.log('   1. FLEXIBILITY: Add ANY field you want to the registry');
  console.log('      → Just INSERT into mdm_global_metadata');
  console.log('      → Define data_type, tier, description');
  console.log('      → Field appears in next type generation');
  console.log();
  console.log('   2. GOVERNANCE: Tier-based approval + Standard Pack enforcement');
  console.log('      → tier1/tier2 REQUIRE standard_pack_id (IFRS, MFRS, SOC2)');
  console.log('      → GRCD validation prevents ungoverned financial fields');
  console.log('      → Audit trail via created_by, updated_by');
  console.log();
  console.log('   3. SELECTION: Choose which fields to include');
  console.log('      → Filter by domain, module, tier, status');
  console.log('      → Generate types for specific entities only');
  console.log('      → Support for "views" (subset of fields)');
  console.log();

  console.log('─'.repeat(70));
  console.log('Example: Adding a new field with governance');
  console.log('─'.repeat(70));
  console.log(`
-- Step 1: Register in Entity Catalog (if new entity)
INSERT INTO mdm_entity_catalog (tenant_id, entity_urn, entity_name, entity_type, domain, module, created_by)
VALUES ('00000000-0000-0000-0000-000000000001', 'finance.invoices', 'Invoices', 'table', 'finance', 'ap', 'system');

-- Step 2: Register the field in Metadata Registry
INSERT INTO mdm_global_metadata (
  tenant_id, canonical_key, label, description,
  domain, module, entity_urn, tier, data_type,
  standard_pack_id, -- Required for tier1/tier2
  owner_id, steward_id, created_by, updated_by
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'finance.invoices.total_amount',
  'Total Amount',
  'Invoice total after tax',
  'finance', 'ap', 'finance.invoices',
  'tier2', -- Governed tier
  'decimal',
  'MFRS-101', -- Required for tier2
  'cfo', 'data_team', 'system', 'system'
);

-- Step 3: Regenerate types
-- pnpm metadata:generate-types:live
`);
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const command = args[0] ?? 'list';

  switch (command) {
    case 'list':
      listEntities(MOCK_FIELDS);
      break;

    case 'validate':
      const validation = validateGRCDRules(MOCK_FIELDS);
      if (validation.valid) {
        console.log('✅ All GRCD rules satisfied');
      } else {
        console.log('❌ GRCD Violations:');
        for (const v of validation.violations) {
          console.log(`   ${v}`);
        }
        process.exit(1);
      }
      break;

    case 'demo':
    case 'flexibility':
      showFlexibilityDemo();
      break;

    case 'tiers':
      console.log('📋 Governance Tiers:');
      console.log('─'.repeat(70));
      for (const [tier, info] of Object.entries(GOVERNANCE_TIERS)) {
        console.log(`  ${tier}: ${info.name}`);
        console.log(`     Approval: ${info.approvalRequired}`);
        console.log(`     Standard Pack Required: ${info.standardPackRequired ? 'YES' : 'No'}`);
        console.log(`     Description: ${info.description}`);
        console.log();
      }
      break;

    default:
      console.log('Usage:');
      console.log('  list       List all entities and fields');
      console.log('  validate   Validate GRCD rules');
      console.log('  demo       Show flexibility demonstration');
      console.log('  tiers      Show governance tier definitions');
  }
}

main();
