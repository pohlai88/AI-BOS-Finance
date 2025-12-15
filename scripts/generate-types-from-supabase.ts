#!/usr/bin/env tsx
/**
 * CONT_06 Type Generator — Supabase Live Mode
 * 
 * This script generates TypeScript types and Zod schemas from the LIVE
 * Metadata Registry in Supabase (mdm_global_metadata).
 * 
 * USAGE:
 *   pnpm metadata:generate-types:live   # Query Supabase, generate types
 * 
 * REQUIREMENTS:
 *   - Supabase project connected
 *   - mdm_global_metadata table populated
 *   - Run from Cursor with Supabase MCP enabled
 * 
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  Supabase Database (mdm_global_metadata)                                   │
 * │  Source of Truth — Populated via Metadata Studio or seed scripts           │
 * └──────────────────────────────────────────────────────────────────────────────┘
 *                                        │
 *                                        ▼ Supabase MCP Query
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  This Script (generate-types-from-supabase.ts)                              │
 * │  - Queries mdm_global_metadata via execute_sql                              │
 * │  - Groups by entity_urn                                                     │
 * │  - Generates TypeScript interfaces + Zod schemas                            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *                                        │
 *                                        ▼ File Output
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  packages/kernel-core/src/db/generated/                                     │
 * │  ├── types.ts   (TypeScript interfaces)                                     │
 * │  └── schemas.ts (Zod validation schemas)                                    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * @see CONT_06_SchemaAndTypeGovernance.md
 * @see CONT_06_SCHEMA_SPEC.md
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  outputPath: 'packages/kernel-core/src/db/generated/types.ts',
  zodOutputPath: 'packages/kernel-core/src/db/generated/schemas.ts',
  tenantId: '00000000-0000-0000-0000-000000000001', // Demo tenant
  
  dataTypeMap: {
    'text': 'string',
    'string': 'string',
    'varchar': 'string',
    'integer': 'number',
    'int': 'number',
    'smallint': 'number',
    'bigint': 'string',
    'decimal': 'string',
    'numeric': 'string',
    'real': 'number',
    'double': 'number',
    'float': 'number',
    'money': 'string',
    'boolean': 'boolean',
    'bool': 'boolean',
    'date': 'string',
    'timestamp': 'Date',
    'timestamptz': 'Date',
    'time': 'string',
    'uuid': 'string',
    'json': 'unknown',
    'jsonb': 'unknown',
  } as Record<string, string>,
  
  zodTypeMap: {
    'text': 'z.string()',
    'string': 'z.string()',
    'varchar': 'z.string()',
    'integer': 'z.number().int()',
    'int': 'z.number().int()',
    'smallint': 'z.number().int()',
    'bigint': 'z.string()',
    'decimal': 'z.string()',
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
  } as Record<string, string>,
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface MetadataRow {
  canonical_key: string;
  label: string;
  description: string | null;
  domain: string;
  module: string;
  entity_urn: string;
  data_type: string;
  format: string | null;
}

interface EntityDefinition {
  entityUrn: string;
  domain: string;
  module: string;
  fields: MetadataRow[];
}

// ============================================================================
// UTILITIES
// ============================================================================

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

function extractFieldName(canonicalKey: string): string {
  // canonical_key format: "entity_urn.field_name"
  const parts = canonicalKey.split('.');
  return parts[parts.length - 1];
}

function dataTypeToTsType(dataType: string): string {
  return CONFIG.dataTypeMap[dataType.toLowerCase()] ?? 'unknown';
}

function dataTypeToZodType(dataType: string): string {
  return CONFIG.zodTypeMap[dataType.toLowerCase()] ?? 'z.unknown()';
}

function groupByEntity(rows: MetadataRow[]): EntityDefinition[] {
  const entityMap = new Map<string, EntityDefinition>();
  
  for (const row of rows) {
    const existing = entityMap.get(row.entity_urn);
    if (existing) {
      existing.fields.push(row);
    } else {
      entityMap.set(row.entity_urn, {
        entityUrn: row.entity_urn,
        domain: row.domain,
        module: row.module,
        fields: [row],
      });
    }
  }
  
  return Array.from(entityMap.values());
}

// ============================================================================
// GENERATORS
// ============================================================================

function generateInterface(entity: EntityDefinition): string {
  const interfaceName = urnToInterfaceName(entity.entityUrn);
  
  const fieldDefs = entity.fields
    .map(field => {
      const propName = extractFieldName(field.canonical_key);
      const tsType = dataTypeToTsType(field.data_type);
      const comment = field.description ? `  /** ${field.description} */\n` : '';
      return `${comment}  ${propName}: ${tsType};`;
    })
    .join('\n');
  
  return `/**
 * Generated from entity: ${entity.entityUrn}
 * Domain: ${entity.domain} | Module: ${entity.module}
 * Source: Supabase mdm_global_metadata (SSOT)
 * 
 * @generated DO NOT EDIT - Derived from Metadata Registry
 */
export interface ${interfaceName} {
${fieldDefs}
}`;
}

function generateZodSchema(entity: EntityDefinition): string {
  const interfaceName = urnToInterfaceName(entity.entityUrn);
  const schemaName = interfaceName.replace('Table', 'TableSchema');
  
  const fieldDefs = entity.fields
    .map(field => {
      const propName = extractFieldName(field.canonical_key);
      const zodType = dataTypeToZodType(field.data_type);
      return `  ${propName}: ${zodType},`;
    })
    .join('\n');
  
  return `/**
 * Zod schema for ${entity.entityUrn}
 * Source: Supabase mdm_global_metadata (SSOT)
 * 
 * @generated DO NOT EDIT - Derived from Metadata Registry
 */
export const ${schemaName} = z.object({
${fieldDefs}
}) satisfies z.ZodType<${interfaceName}>;`;
}

function generateTypesFile(entities: EntityDefinition[]): string {
  const header = `/**
 * AUTO-GENERATED TYPES FROM SUPABASE METADATA REGISTRY
 * 
 * ⚠️ DO NOT EDIT THIS FILE DIRECTLY!
 * 
 * Source: Supabase mdm_global_metadata table (SSOT)
 * Generator: scripts/generate-types-from-supabase.ts
 * 
 * To regenerate:
 *   1. Update metadata in Supabase via Metadata Studio
 *   2. Run: pnpm metadata:generate-types:live
 * 
 * @see CONT_06_SchemaAndTypeGovernance.md
 * @see CONT_06_SCHEMA_SPEC.md
 * @generated ${new Date().toISOString()}
 */

`;

  const interfaces = entities
    .map(entity => generateInterface(entity))
    .join('\n\n');
  
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

function generateZodFile(entities: EntityDefinition[]): string {
  const header = `/**
 * AUTO-GENERATED ZOD SCHEMAS FROM SUPABASE METADATA REGISTRY
 * 
 * ⚠️ DO NOT EDIT THIS FILE DIRECTLY!
 * 
 * Source: Supabase mdm_global_metadata table (SSOT)
 * Generator: scripts/generate-types-from-supabase.ts
 * 
 * To regenerate:
 *   1. Update metadata in Supabase via Metadata Studio
 *   2. Run: pnpm metadata:generate-types:live
 * 
 * @see CONT_06_SchemaAndTypeGovernance.md
 * @see CONT_06_SCHEMA_SPEC.md
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
// MAIN — Designed to be called with Supabase data
// ============================================================================

/**
 * Main entry point — expects metadata rows from Supabase query
 */
export function generateFromMetadata(rows: MetadataRow[], dryRun = false): void {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  CONT_06 Type Generator — Supabase Live Mode                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  console.log(`📥 Received ${rows.length} field definitions from Supabase`);
  
  // Group by entity
  const entities = groupByEntity(rows);
  console.log(`🔄 Grouped into ${entities.length} entities:`);
  entities.forEach(e => {
    console.log(`     - ${e.entityUrn} (${e.fields.length} fields)`);
  });
  console.log();
  
  // Generate files
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
  } else {
    const typesDir = dirname(join(process.cwd(), CONFIG.outputPath));
    if (!existsSync(typesDir)) {
      mkdirSync(typesDir, { recursive: true });
    }
    
    writeFileSync(join(process.cwd(), CONFIG.outputPath), typesContent);
    writeFileSync(join(process.cwd(), CONFIG.zodOutputPath), zodContent);
    
    console.log(`   ✅ Generated: ${CONFIG.outputPath}`);
    console.log(`   ✅ Generated: ${CONFIG.zodOutputPath}`);
  }
  
  console.log();
  console.log('📊 Summary:');
  console.log(`   Entities: ${entities.length}`);
  console.log(`   Fields:   ${rows.length}`);
  console.log(`   Domains:  ${[...new Set(entities.map(e => e.domain))].join(', ')}`);
  console.log();
  console.log('✅ Type generation complete!');
}

/**
 * CLI Mode — Prints the SQL query needed for Supabase MCP
 */
function printSupabaseQuery(): void {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  CONT_06 Type Generator — Supabase Query Mode                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  console.log('To generate types from Supabase, run this SQL query via MCP:');
  console.log();
  console.log('─'.repeat(70));
  console.log(`
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
WHERE tenant_id = '${CONFIG.tenantId}'
  AND status = 'active'
ORDER BY entity_urn, canonical_key;
`);
  console.log('─'.repeat(70));
  console.log();
  console.log('Then pass the result to generateFromMetadata() function.');
  console.log();
  console.log('Or use Cursor with Supabase MCP to execute the query directly.');
}

// CLI Entry Point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--query')) {
    printSupabaseQuery();
  } else {
    console.log('Usage:');
    console.log('  --query   Print the Supabase SQL query to fetch metadata');
    console.log();
    console.log('For live generation, use this script as a module:');
    console.log('  import { generateFromMetadata } from "./generate-types-from-supabase"');
    console.log('  generateFromMetadata(supabaseQueryResult);');
  }
}
