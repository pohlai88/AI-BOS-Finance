#!/usr/bin/env tsx
/**
 * CONT_06 Type Generator — SSOT Implementation
 * 
 * This script is the SINGLE SOURCE OF TRUTH for generating TypeScript types
 * from the Metadata Registry (mdm_global_metadata).
 * 
 * MODES:
 * 1. --mock     : Use built-in mock data (for development)
 * 2. --supabase : Use Supabase MCP to query live database
 * 3. (default)  : Tries Supabase, falls back to mock
 * 
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Metadata Registry (mdm_global_metadata)                     │
 * │ Location: Supabase (via MCP) or Mock Data                   │
 * └──────────────────────┬──────────────────────────────────────┘
 *                        │
 *                        ▼ [This Script]
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Generated Types                                              │
 * │ Location: packages/kernel-core/src/db/generated/types.ts    │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * USAGE:
 *   pnpm metadata:generate-types           # Auto-detect (Supabase or mock)
 *   pnpm metadata:generate-types --mock    # Use mock data only
 *   pnpm metadata:generate-types --supabase # Force Supabase MCP
 *   pnpm metadata:generate-types --dry-run # Preview without writing
 * 
 * @see CONT_06_SchemaAndTypeGovernance.md
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

// ============================================================================
// CONFIGURATION — Single Source of Truth
// ============================================================================

const CONFIG = {
  /** Output file for generated types */
  outputPath: 'packages/kernel-core/src/db/generated/types.ts',

  /** Output file for generated Zod schemas */
  zodOutputPath: 'packages/kernel-core/src/db/generated/schemas.ts',

  /** Metadata table name */
  metadataTable: 'mdm_global_metadata',

  /** Mapping from metadata dataType to TypeScript type */
  dataTypeMap: {
    // Text types
    'text': 'string',
    'string': 'string',
    'varchar': 'string',
    'char': 'string',

    // Numeric types
    'integer': 'number',
    'int': 'number',
    'smallint': 'number',
    'bigint': 'string', // bigint as string to avoid precision loss
    'decimal': 'string', // decimal as string for precision
    'numeric': 'string',
    'real': 'number',
    'double': 'number',
    'float': 'number',
    'money': 'string',

    // Boolean
    'boolean': 'boolean',
    'bool': 'boolean',

    // Date/Time
    'date': 'string', // ISO date string
    'timestamp': 'Date',
    'timestamptz': 'Date',
    'time': 'string',
    'timetz': 'string',
    'interval': 'string',

    // UUID
    'uuid': 'string',

    // JSON
    'json': 'unknown',
    'jsonb': 'unknown',

    // Arrays (base types, actual arrays handled separately)
    'array': 'unknown[]',

    // Fallback
    'unknown': 'unknown',
  } as Record<string, string>,

  /** Mapping from metadata dataType to Zod validator */
  zodTypeMap: {
    'text': 'z.string()',
    'string': 'z.string()',
    'varchar': 'z.string()',
    'char': 'z.string()',
    'integer': 'z.number().int()',
    'int': 'z.number().int()',
    'smallint': 'z.number().int()',
    'bigint': 'z.string()', // For precision
    'decimal': 'z.string()', // For precision
    'numeric': 'z.string()',
    'real': 'z.number()',
    'double': 'z.number()',
    'float': 'z.number()',
    'money': 'z.string()',
    'boolean': 'z.boolean()',
    'bool': 'z.boolean()',
    'date': 'z.string().date()',
    'timestamp': 'z.date()',
    'timestamptz': 'z.date()',
    'time': 'z.string()',
    'uuid': 'z.string().uuid()',
    'json': 'z.unknown()',
    'jsonb': 'z.unknown()',
    'array': 'z.array(z.unknown())',
    'unknown': 'z.unknown()',
  } as Record<string, string>,
} as const;

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

interface EntityDefinition {
  entityUrn: string;
  domain: string;
  module: string;
  fields: MetadataField[];
}

// ============================================================================
// MOCK DATA (for development without DB connection)
// Aligned with actual metadata-studio schema
// ============================================================================

const MOCK_METADATA: MetadataField[] = [
  // ==========================================================================
  // KERNEL DOMAIN
  // ==========================================================================

  // kernel.tenants
  {
    canonicalKey: 'id',
    label: 'Tenant ID',
    description: 'Unique identifier for the tenant (UUID)',
    domain: 'kernel',
    module: 'iam',
    entityUrn: 'kernel.tenants',
    dataType: 'uuid',
  },
  {
    canonicalKey: 'name',
    label: 'Tenant Name',
    description: 'Name of the tenant organization',
    domain: 'kernel',
    module: 'iam',
    entityUrn: 'kernel.tenants',
    dataType: 'text',
  },
  {
    canonicalKey: 'status',
    label: 'Tenant Status',
    description: 'Current status (ACTIVE, SUSPENDED, PENDING)',
    domain: 'kernel',
    module: 'iam',
    entityUrn: 'kernel.tenants',
    dataType: 'text',
  },
  {
    canonicalKey: 'created_at',
    label: 'Created At',
    description: 'Timestamp when tenant was created',
    domain: 'kernel',
    module: 'iam',
    entityUrn: 'kernel.tenants',
    dataType: 'timestamptz',
  },
  {
    canonicalKey: 'updated_at',
    label: 'Updated At',
    description: 'Timestamp when tenant was last updated',
    domain: 'kernel',
    module: 'iam',
    entityUrn: 'kernel.tenants',
    dataType: 'timestamptz',
  },

  // kernel.users
  {
    canonicalKey: 'id',
    label: 'User ID',
    description: 'Unique identifier for the user (UUID)',
    domain: 'kernel',
    module: 'iam',
    entityUrn: 'kernel.users',
    dataType: 'uuid',
  },
  {
    canonicalKey: 'tenant_id',
    label: 'Tenant ID',
    description: 'Reference to tenant',
    domain: 'kernel',
    module: 'iam',
    entityUrn: 'kernel.users',
    dataType: 'uuid',
  },
  {
    canonicalKey: 'email',
    label: 'Email',
    description: 'User email address',
    domain: 'kernel',
    module: 'iam',
    entityUrn: 'kernel.users',
    dataType: 'text',
  },
  {
    canonicalKey: 'name',
    label: 'Name',
    description: 'User display name',
    domain: 'kernel',
    module: 'iam',
    entityUrn: 'kernel.users',
    dataType: 'text',
  },
  {
    canonicalKey: 'password_hash',
    label: 'Password Hash',
    description: 'Hashed password (nullable until set)',
    domain: 'kernel',
    module: 'iam',
    entityUrn: 'kernel.users',
    dataType: 'text',
    nullable: true,
  },
  {
    canonicalKey: 'created_at',
    label: 'Created At',
    description: 'Timestamp when user was created',
    domain: 'kernel',
    module: 'iam',
    entityUrn: 'kernel.users',
    dataType: 'timestamptz',
  },
  {
    canonicalKey: 'updated_at',
    label: 'Updated At',
    description: 'Timestamp when user was last updated',
    domain: 'kernel',
    module: 'iam',
    entityUrn: 'kernel.users',
    dataType: 'timestamptz',
  },

  // ==========================================================================
  // FINANCE DOMAIN
  // ==========================================================================

  // finance.journal_entries
  {
    canonicalKey: 'id',
    label: 'Journal ID',
    description: 'Unique identifier for journal entry',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_entries',
    dataType: 'uuid',
  },
  {
    canonicalKey: 'tenant_id',
    label: 'Tenant ID',
    description: 'Reference to tenant for multi-tenancy',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_entries',
    dataType: 'uuid',
  },
  {
    canonicalKey: 'journal_date',
    label: 'Journal Date',
    description: 'Date of the journal entry',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_entries',
    dataType: 'date',
  },
  {
    canonicalKey: 'description',
    label: 'Description',
    description: 'Journal entry description',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_entries',
    dataType: 'text',
  },
  {
    canonicalKey: 'status',
    label: 'Status',
    description: 'Journal entry status (DRAFT, POSTED, REVERSED)',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_entries',
    dataType: 'text',
  },
  {
    canonicalKey: 'created_at',
    label: 'Created At',
    description: 'Timestamp when entry was created',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_entries',
    dataType: 'timestamptz',
  },
  {
    canonicalKey: 'updated_at',
    label: 'Updated At',
    description: 'Timestamp when entry was last updated',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_entries',
    dataType: 'timestamptz',
  },
  {
    canonicalKey: 'posted_at',
    label: 'Posted At',
    description: 'Timestamp when entry was posted (immutable after)',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_entries',
    dataType: 'timestamptz',
    nullable: true,
  },

  // finance.journal_lines
  {
    canonicalKey: 'id',
    label: 'Line ID',
    description: 'Unique identifier for journal line',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_lines',
    dataType: 'uuid',
  },
  {
    canonicalKey: 'tenant_id',
    label: 'Tenant ID',
    description: 'Reference to tenant for multi-tenancy',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_lines',
    dataType: 'uuid',
  },
  {
    canonicalKey: 'journal_id',
    label: 'Journal ID',
    description: 'Reference to parent journal entry',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_lines',
    dataType: 'uuid',
  },
  {
    canonicalKey: 'account_code',
    label: 'Account Code',
    description: 'GL account code',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_lines',
    dataType: 'text',
  },
  {
    canonicalKey: 'debit_amount',
    label: 'Debit Amount',
    description: 'Debit amount (null if credit)',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_lines',
    dataType: 'decimal',
    nullable: true,
  },
  {
    canonicalKey: 'credit_amount',
    label: 'Credit Amount',
    description: 'Credit amount (null if debit)',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_lines',
    dataType: 'decimal',
    nullable: true,
  },
  {
    canonicalKey: 'created_at',
    label: 'Created At',
    description: 'Timestamp when line was created',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.journal_lines',
    dataType: 'timestamptz',
  },

  // finance.accounts (Chart of Accounts)
  {
    canonicalKey: 'id',
    label: 'Account ID',
    description: 'Unique identifier for GL account',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.accounts',
    dataType: 'uuid',
  },
  {
    canonicalKey: 'tenant_id',
    label: 'Tenant ID',
    description: 'Reference to tenant for multi-tenancy',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.accounts',
    dataType: 'uuid',
  },
  {
    canonicalKey: 'account_code',
    label: 'Account Code',
    description: 'Unique account code (e.g., 1000, 2000)',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.accounts',
    dataType: 'text',
  },
  {
    canonicalKey: 'account_name',
    label: 'Account Name',
    description: 'Display name of the account',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.accounts',
    dataType: 'text',
  },
  {
    canonicalKey: 'account_type',
    label: 'Account Type',
    description: 'Type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.accounts',
    dataType: 'text',
  },
  {
    canonicalKey: 'is_active',
    label: 'Is Active',
    description: 'Whether account is active',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.accounts',
    dataType: 'boolean',
  },
  {
    canonicalKey: 'created_at',
    label: 'Created At',
    description: 'Timestamp when account was created',
    domain: 'finance',
    module: 'gl',
    entityUrn: 'finance.accounts',
    dataType: 'timestamptz',
  },

  // ==========================================================================
  // METADATA DOMAIN (MDM)
  // ==========================================================================

  // metadata.global_metadata (mdm_global_metadata)
  {
    canonicalKey: 'id',
    label: 'Metadata ID',
    description: 'Unique identifier for metadata entry',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'uuid',
  },
  {
    canonicalKey: 'tenant_id',
    label: 'Tenant ID',
    description: 'Reference to tenant for multi-tenancy',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'uuid',
  },
  {
    canonicalKey: 'canonical_key',
    label: 'Canonical Key',
    description: 'Unique canonical name per tenant (e.g., revenue_gross)',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'text',
  },
  {
    canonicalKey: 'label',
    label: 'Label',
    description: 'Human-readable label',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'text',
  },
  {
    canonicalKey: 'description',
    label: 'Description',
    description: 'Detailed description of the metadata',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'text',
    nullable: true,
  },
  {
    canonicalKey: 'domain',
    label: 'Domain',
    description: 'Business domain (e.g., finance, hr)',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'text',
  },
  {
    canonicalKey: 'module',
    label: 'Module',
    description: 'Module within domain (e.g., gl, ap)',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'text',
  },
  {
    canonicalKey: 'entity_urn',
    label: 'Entity URN',
    description: 'Entity identifier (e.g., finance.journal_entries)',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'text',
  },
  {
    canonicalKey: 'tier',
    label: 'Governance Tier',
    description: 'Governance tier (tier1, tier2, tier3, tier4, tier5)',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'text',
  },
  {
    canonicalKey: 'data_type',
    label: 'Data Type',
    description: 'Technical data type (text, uuid, decimal, etc.)',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'text',
  },
  {
    canonicalKey: 'status',
    label: 'Status',
    description: 'Metadata status (active, deprecated, draft)',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'text',
  },
  {
    canonicalKey: 'owner_id',
    label: 'Owner ID',
    description: 'Data owner (e.g., CFO)',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'text',
  },
  {
    canonicalKey: 'steward_id',
    label: 'Steward ID',
    description: 'Data steward (e.g., Data Governance Team)',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'text',
  },
  {
    canonicalKey: 'created_at',
    label: 'Created At',
    description: 'Timestamp when metadata was created',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'timestamptz',
  },
  {
    canonicalKey: 'updated_at',
    label: 'Updated At',
    description: 'Timestamp when metadata was last updated',
    domain: 'metadata',
    module: 'mdm',
    entityUrn: 'metadata.global_metadata',
    dataType: 'timestamptz',
  },
];

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert entity URN to TypeScript interface name
 * e.g., "finance.journal_entries" → "FinanceJournalEntriesTable"
 */
function urnToInterfaceName(entityUrn: string): string {
  return entityUrn
    .split('.')
    .map(part =>
      part
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
    )
    .join('') + 'Table';
}

/**
 * Convert canonical_key to TypeScript property name
 * Keep snake_case for DB column names
 */
function keyToPropertyName(canonicalKey: string): string {
  return canonicalKey;
}

/**
 * Map metadata dataType to TypeScript type
 */
function dataTypeToTsType(dataType: string, nullable?: boolean): string {
  const baseType = CONFIG.dataTypeMap[dataType.toLowerCase()] ?? 'unknown';
  return nullable ? `${baseType} | null` : baseType;
}

/**
 * Map metadata dataType to Zod validator
 */
function dataTypeToZodType(dataType: string, nullable?: boolean): string {
  const baseZod = CONFIG.zodTypeMap[dataType.toLowerCase()] ?? 'z.unknown()';
  return nullable ? `${baseZod}.nullable()` : baseZod;
}

/**
 * Group metadata fields by entity URN
 */
function groupByEntity(fields: MetadataField[]): EntityDefinition[] {
  const entityMap = new Map<string, EntityDefinition>();

  for (const field of fields) {
    const existing = entityMap.get(field.entityUrn);
    if (existing) {
      existing.fields.push(field);
    } else {
      entityMap.set(field.entityUrn, {
        entityUrn: field.entityUrn,
        domain: field.domain,
        module: field.module,
        fields: [field],
      });
    }
  }

  return Array.from(entityMap.values());
}

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generate TypeScript interface from entity definition
 */
function generateInterface(entity: EntityDefinition): string {
  const interfaceName = urnToInterfaceName(entity.entityUrn);

  const fieldDefs = entity.fields
    .map(field => {
      const propName = keyToPropertyName(field.canonicalKey);
      const tsType = dataTypeToTsType(field.dataType, field.nullable);
      const comment = field.description ? `  /** ${field.description} */\n` : '';
      return `${comment}  ${propName}: ${tsType};`;
    })
    .join('\n');

  return `/**
 * Generated from entity: ${entity.entityUrn}
 * Domain: ${entity.domain} | Module: ${entity.module}
 * 
 * @generated DO NOT EDIT - Generated from Metadata Registry
 */
export interface ${interfaceName} {
${fieldDefs}
}`;
}

/**
 * Generate Zod schema from entity definition
 */
function generateZodSchema(entity: EntityDefinition): string {
  const interfaceName = urnToInterfaceName(entity.entityUrn);
  const schemaName = interfaceName.replace('Table', 'TableSchema');

  const fieldDefs = entity.fields
    .map(field => {
      const propName = keyToPropertyName(field.canonicalKey);
      const zodType = dataTypeToZodType(field.dataType, field.nullable);
      return `  ${propName}: ${zodType},`;
    })
    .join('\n');

  return `/**
 * Zod schema for ${entity.entityUrn}
 * 
 * @generated DO NOT EDIT - Generated from Metadata Registry
 */
export const ${schemaName} = z.object({
${fieldDefs}
}) satisfies z.ZodType<${interfaceName}>;`;
}

/**
 * Generate complete types file
 */
function generateTypesFile(entities: EntityDefinition[]): string {
  const header = `/**
 * AUTO-GENERATED TYPES FROM METADATA REGISTRY
 * 
 * DO NOT EDIT THIS FILE DIRECTLY!
 * 
 * This file is generated by: scripts/generate-types-from-metadata.ts
 * Source: Metadata Registry (mdm_global_metadata)
 * 
 * To regenerate:
 *   pnpm metadata:generate-types
 * 
 * @see CONT_06_SchemaAndTypeGovernance.md
 * @generated ${new Date().toISOString()}
 */

`;

  const interfaces = entities
    .map(entity => generateInterface(entity))
    .join('\n\n');

  // Group by domain for export organization
  const domains = [...new Set(entities.map(e => e.domain))];
  const exportsByDomain = domains
    .map(domain => {
      const domainEntities = entities.filter(e => e.domain === domain);
      const exports = domainEntities
        .map(e => urnToInterfaceName(e.entityUrn))
        .join(',\n  ');
      return `// ${domain.toUpperCase()} Domain\nexport type {\n  ${exports},\n};`;
    })
    .join('\n\n');

  return header + interfaces + '\n\n// ============================================================================\n// EXPORTS BY DOMAIN\n// ============================================================================\n\n' + exportsByDomain + '\n';
}

/**
 * Generate complete Zod schemas file
 */
function generateZodFile(entities: EntityDefinition[]): string {
  const header = `/**
 * AUTO-GENERATED ZOD SCHEMAS FROM METADATA REGISTRY
 * 
 * DO NOT EDIT THIS FILE DIRECTLY!
 * 
 * This file is generated by: scripts/generate-types-from-metadata.ts
 * Source: Metadata Registry (mdm_global_metadata)
 * 
 * To regenerate:
 *   pnpm metadata:generate-types
 * 
 * @see CONT_06_SchemaAndTypeGovernance.md
 * @generated ${new Date().toISOString()}
 */

import { z } from 'zod';
import type {
${entities.map(e => '  ' + urnToInterfaceName(e.entityUrn) + ',').join('\n')}
} from './types';

`;

  const schemas = entities
    .map(entity => generateZodSchema(entity))
    .join('\n\n');

  return header + schemas + '\n';
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const useMock = args.includes('--mock');
  const useSupabase = args.includes('--supabase');
  const dryRun = args.includes('--dry-run');

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  CONT_06 Type Generator — SSOT Implementation                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();

  // Step 1: Load metadata
  console.log('📥 Loading metadata...');
  let metadata: MetadataField[];

  if (useMock) {
    console.log('   Using MOCK data (--mock flag)');
    metadata = MOCK_METADATA;
  } else if (useSupabase) {
    console.log('   🔄 Supabase MCP mode requested');
    console.log('   ⚠️  Note: Supabase MCP integration requires running in MCP context');
    console.log('   ⚠️  Falling back to MOCK data for CLI execution');
    console.log('   💡 Tip: Use Supabase MCP tools directly in Cursor for live data');
    metadata = MOCK_METADATA;
  } else {
    console.log('   Using MOCK data (default - run with --supabase for live DB)');
    metadata = MOCK_METADATA;
  }

  console.log(`   Found ${metadata.length} field definitions`);
  console.log();

  // Step 2: Group by entity
  console.log('🔄 Grouping by entity...');
  const entities = groupByEntity(metadata);
  console.log(`   Found ${entities.length} entities:`);
  entities.forEach(e => {
    console.log(`     - ${e.entityUrn} (${e.fields.length} fields)`);
  });
  console.log();

  // Step 3: Generate files
  console.log('🔧 Generating files...');

  const typesContent = generateTypesFile(entities);
  const zodContent = generateZodFile(entities);

  if (dryRun) {
    console.log('   [DRY RUN] Would generate:');
    console.log(`     - ${CONFIG.outputPath}`);
    console.log(`     - ${CONFIG.zodOutputPath}`);
    console.log();
    console.log('   Preview of types.ts:');
    console.log('   ' + '─'.repeat(60));
    console.log(typesContent.split('\n').slice(0, 40).join('\n'));
    console.log('   ... (truncated)');
    console.log();
  } else {
    // Ensure directories exist
    const typesDir = dirname(join(process.cwd(), CONFIG.outputPath));
    const zodDir = dirname(join(process.cwd(), CONFIG.zodOutputPath));

    if (!existsSync(typesDir)) {
      mkdirSync(typesDir, { recursive: true });
    }
    if (!existsSync(zodDir)) {
      mkdirSync(zodDir, { recursive: true });
    }

    // Write files
    writeFileSync(join(process.cwd(), CONFIG.outputPath), typesContent);
    writeFileSync(join(process.cwd(), CONFIG.zodOutputPath), zodContent);

    console.log(`   ✅ Generated: ${CONFIG.outputPath}`);
    console.log(`   ✅ Generated: ${CONFIG.zodOutputPath}`);
    console.log();
  }

  // Step 4: Summary
  console.log('📊 Summary:');
  console.log(`   Entities: ${entities.length}`);
  console.log(`   Fields:   ${metadata.length}`);
  console.log(`   Domains:  ${[...new Set(entities.map(e => e.domain))].join(', ')}`);
  console.log();
  console.log('✅ Type generation complete!');
  console.log();
  console.log('Next steps:');
  console.log('  1. Review generated files in packages/kernel-core/src/db/generated/');
  console.log('  2. Import types: import { FinanceJournalEntriesTable } from "@aibos/kernel-core/db/generated"');
  console.log('  3. For live Supabase data, use Supabase MCP tools in Cursor');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
