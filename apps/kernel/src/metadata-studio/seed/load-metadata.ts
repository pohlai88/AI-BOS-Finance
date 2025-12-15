// bootstrap/metadata/load-metadata.ts

/**
 * Metadata Bootstrap Loader
 * 
 * Loads standard packs and canonical concepts from CSV files into:
 * - mdm_standard_pack
 * - mdm_global_metadata
 * 
 * Usage:
 *   pnpm metadata:bootstrap
 */

import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { db } from '../../metadata-studio/db/client';
import { mdmStandardPack } from '../../metadata-studio/db/schema/standard-pack.tables';
import { mdmGlobalMetadata } from '../../metadata-studio/db/schema/metadata.tables';
import { mdmAlias } from '../../metadata-studio/db/schema/alias.tables';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// CSV Row Schemas
// ============================================================================

const StandardPackRowSchema = z.object({
  pack_key: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().min(1),
  version: z.string().default('1.0.0'),
  is_active: z
    .string()
    .transform((v) => v.toLowerCase() === 'true')
    .or(z.boolean())
    .default(true),
  description: z.string().optional().default(''),
});

const ConceptRowSchema = z.object({
  canonical_key: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9]+(_[a-z0-9]+)*$/,
      'canonical_key must be snake_case (a-z, 0-9, underscores only)',
    ),
  label: z.string().min(1),
  domain: z.string().min(1),
  standard_pack_key: z.string().min(1),
  semantic_type: z.string().min(1), // e.g. currency_amount, quantity
  financial_element: z.string().optional().nullable(),
  tier: z.string().min(1), // e.g. tier1, tier2
  description: z.string().optional().default(''),
});

const AliasRowSchema = z.object({
  alias_text: z.string().min(1),
  canonical_key: z.string().optional().default(''),
  language: z.string().min(1).default('en'),
  context_domain: z.string().min(1), // e.g. FINANCIAL_REPORTING, OPERATIONS
  strength: z
    .enum(['PRIMARY_LABEL', 'SECONDARY_LABEL', 'DISCOURAGED', 'FORBIDDEN'])
    .or(z.string().min(1)), // allow free text if you haven't enforced enum yet
  source_system: z.string().min(1).default('AIBOS'),
  notes: z.string().optional().default(''),
});

type StandardPackRow = z.infer<typeof StandardPackRowSchema>;
type ConceptRow = z.infer<typeof ConceptRowSchema>;
type AliasRow = z.infer<typeof AliasRowSchema>;

// ============================================================================
// CSV Helpers
// ============================================================================

function loadCsv(filePath: string): Record<string, string>[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

// ============================================================================
// Standard Pack Loader
// ============================================================================

async function loadStandardPacks() {
  console.log('\n📦 Loading Standard Packs...');

  const filePath = path.join(__dirname, 'standard-packs', 'finance-ifrs-core.csv');
  const rawRows = loadCsv(filePath);

  if (rawRows.length === 0) {
    console.log('  No standard pack rows to load.');
    return;
  }

  const rows = rawRows.map((row) => StandardPackRowSchema.parse(row));

  for (const row of rows) {
    const existing = await db.query.mdmStandardPack.findFirst({
      where: eq(mdmStandardPack.packId, row.pack_key),
    });

    if (existing) {
      // Update existing pack
      await db
        .update(mdmStandardPack)
        .set({
          packName: row.name,
          version: row.version,
          description: row.description,
          status: row.is_active ? 'active' : 'deprecated',
          category: row.domain.toLowerCase(),
          tier: 'tier1', // Default for IFRS packs
          standardBody: 'IFRS', // Default
        })
        .where(eq(mdmStandardPack.packId, row.pack_key));

      console.log(`  ✅ Updated: ${row.pack_key}`);
    } else {
      // Insert new pack
      await db.insert(mdmStandardPack).values({
        packId: row.pack_key,
        packName: row.name,
        version: row.version,
        description: row.description,
        category: row.domain.toLowerCase(),
        tier: 'tier1', // Default for IFRS packs
        status: row.is_active ? 'active' : 'deprecated',
        isPrimary: true,
        standardBody: 'IFRS', // Default
        standardReference: null,
        createdBy: 'bootstrap',
        updatedBy: 'bootstrap',
      });

      console.log(`  ✅ Created: ${row.pack_key}`);
    }
  }

  console.log(`\n✅ Loaded ${rows.length} standard pack(s)`);
}

// ============================================================================
// Concept Loader
// ============================================================================

async function loadConcepts() {
  console.log('\n📝 Loading Canonical Concepts...');

  const filePath = path.join(__dirname, 'concepts', 'finance-core.csv');
  const rawRows = loadCsv(filePath);

  if (rawRows.length === 0) {
    console.log('  No concept rows to load.');
    return;
  }

  const rows = rawRows.map((row) => ConceptRowSchema.parse(row));

  // Bootstrap tenant ID (or use a config)
  const BOOTSTRAP_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  for (const row of rows) {
    // 1. Ensure referenced standard pack exists
    const pack = await db.query.mdmStandardPack.findFirst({
      where: eq(mdmStandardPack.packId, row.standard_pack_key),
    });

    if (!pack) {
      console.warn(
        `  ⚠️  Skipping "${row.canonical_key}" - standard_pack_key="${row.standard_pack_key}" not found`,
      );
      continue;
    }

    // 2. Check if concept already exists for this tenant
    const existing = await db.query.mdmGlobalMetadata.findFirst({
      where: and(
        eq(mdmGlobalMetadata.tenantId, BOOTSTRAP_TENANT_ID),
        eq(mdmGlobalMetadata.canonicalKey, row.canonical_key),
      ),
    });

    // 3. Map semantic_type to dataType
    const dataTypeMap: Record<string, string> = {
      currency_amount: 'decimal',
      quantity: 'integer',
      kpi: 'decimal',
      percentage: 'decimal',
      text: 'string',
    };

    const dataType = dataTypeMap[row.semantic_type] || 'string';

    // 4. Generate entity URN
    const entityUrn = `urn:aibos:metadata:${BOOTSTRAP_TENANT_ID}:${row.canonical_key}`;

    if (existing) {
      // Update existing concept
      await db
        .update(mdmGlobalMetadata)
        .set({
          label: row.label,
          description: row.description,
          domain: row.domain,
          tier: row.tier,
          standardPackId: row.standard_pack_key,
          dataType: dataType,
          updatedBy: 'bootstrap',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(mdmGlobalMetadata.tenantId, BOOTSTRAP_TENANT_ID),
            eq(mdmGlobalMetadata.canonicalKey, row.canonical_key),
          ),
        );

      console.log(`  ✅ Updated: ${row.canonical_key}`);
    } else {
      // Insert new concept
      await db.insert(mdmGlobalMetadata).values({
        tenantId: BOOTSTRAP_TENANT_ID,
        canonicalKey: row.canonical_key,
        label: row.label,
        description: row.description,
        domain: row.domain,
        module: row.domain.toLowerCase(), // Default: same as domain
        entityUrn: entityUrn,
        tier: row.tier,
        standardPackId: row.standard_pack_key,
        dataType: dataType,
        format: dataType === 'decimal' ? '18,2' : null,
        aliasesRaw: null, // Will be populated later from aliases CSV
        ownerId: 'bootstrap',
        stewardId: 'bootstrap',
        status: 'active',
        isDraft: false,
        createdBy: 'bootstrap',
        updatedBy: 'bootstrap',
      });

      console.log(`  ✅ Created: ${row.canonical_key}`);
    }
  }

  console.log(`\n✅ Loaded ${rows.length} concept(s)`);
}

// ============================================================================
// Alias Loader
// ============================================================================

async function loadAliases() {
  console.log('\n🏷️  Loading Aliases...');

  const filePath = path.join(__dirname, 'aliases', 'finance-aliases.csv');

  if (!fs.existsSync(filePath)) {
    console.log('  ⚠️  Alias CSV not found, skipping alias load.');
    return;
  }

  const rawRows = loadCsv(filePath);

  if (rawRows.length === 0) {
    console.log('  No alias rows to load.');
    return;
  }

  const rows = rawRows.map((row) => AliasRowSchema.parse(row));

  // Bootstrap tenant ID
  const BOOTSTRAP_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.canonical_key) {
      console.warn(
        `  ⚠️  Skipping "${row.alias_text}" (context=${row.context_domain}) - canonical_key is empty (FORBIDDEN alias)`,
      );
      skipped++;
      continue;
    }

    // Find the concept by canonical_key
    const concept = await db.query.mdmGlobalMetadata.findFirst({
      where: and(
        eq(mdmGlobalMetadata.tenantId, BOOTSTRAP_TENANT_ID),
        eq(mdmGlobalMetadata.canonicalKey, row.canonical_key),
      ),
    });

    if (!concept) {
      console.warn(
        `  ⚠️  Skipping "${row.alias_text}" - canonical_key="${row.canonical_key}" not found in mdm_global_metadata`,
      );
      skipped++;
      continue;
    }

    // Check if alias already exists
    const existing = await db.query.mdmAlias.findFirst({
      where: and(
        eq(mdmAlias.aliasText, row.alias_text),
        eq(mdmAlias.canonicalKey, row.canonical_key),
        eq(mdmAlias.contextDomain, row.context_domain),
        eq(mdmAlias.sourceSystem, row.source_system),
      ),
    });

    if (existing) {
      // Update existing alias
      await db
        .update(mdmAlias)
        .set({
          conceptId: concept.id,
          language: row.language,
          strength: row.strength,
          notes: row.notes,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(mdmAlias.id, existing.id));

      updated++;
      console.log(`  ✅ Updated: "${row.alias_text}" → ${row.canonical_key} (${row.context_domain})`);
    } else {
      // Insert new alias
      await db.insert(mdmAlias).values({
        aliasText: row.alias_text,
        canonicalKey: row.canonical_key,
        conceptId: concept.id,
        language: row.language,
        contextDomain: row.context_domain,
        strength: row.strength,
        sourceSystem: row.source_system,
        notes: row.notes,
        isActive: true,
      });

      inserted++;
      console.log(`  ✅ Created: "${row.alias_text}" → ${row.canonical_key} (${row.context_domain})`);
    }
  }

  console.log(`\n✅ Loaded ${inserted + updated} alias(es) (inserted=${inserted}, updated=${updated}, skipped=${skipped})`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('🚀 Bootstrapping Metadata...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    await loadStandardPacks();
    await loadConcepts();
    await loadAliases();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Metadata Bootstrap Complete!\n');
    console.log('Next steps:');
    console.log('  1. Verify in Supabase:');
    console.log('     SELECT * FROM mdm_standard_pack;');
    console.log('     SELECT * FROM mdm_global_metadata;');
    console.log('     SELECT * FROM mdm_alias;');
    console.log('  2. Query aliases:');
    console.log('     SELECT alias_text, canonical_key, context_domain, strength FROM mdm_alias;');
    console.log('  3. Generate naming variants (optional):');
    console.log('     pnpm metadata:generate-variants');
    console.log('  4. Update SSOT wiki to reference these concepts');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Metadata Bootstrap Failed:', error);
    process.exit(1);
  }
}

main();

