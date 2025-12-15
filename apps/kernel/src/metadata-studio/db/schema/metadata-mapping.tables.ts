import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * mdm_metadata_mapping
 *
 * Field Mapping Registry: Maps local system fields to canonical definitions.
 * This is part of the CONT_06 Metadata Registry.
 *
 * Use cases:
 * - Map SAP field names to canonical metadata
 * - Track AI-suggested mappings with confidence scores
 * - Approval workflow for field mappings
 *
 * @see CONT_06_SCHEMA_SPEC.md Section 1.3
 */
export const mdmMetadataMapping = pgTable(
  'mdm_metadata_mapping',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Multi-tenant isolation
    tenantId: uuid('tenant_id').notNull(),

    // Source system name (e.g., SAP_ERP_PROD)
    localSystem: text('local_system').notNull(),

    // Local table/entity name
    localEntity: text('local_entity').notNull(),

    // Local field/column name
    localField: text('local_field').notNull(),

    // Reference to canonical metadata
    canonicalKey: text('canonical_key').notNull(),

    // How mapped: manual, ai-suggested
    mappingSource: text('mapping_source').notNull().default('manual'),

    // Approval status: pending, approved, rejected
    approvalStatus: text('approval_status').notNull().default('approved'),

    // AI confidence score (0.00-1.00)
    confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),

    // Audit columns
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
  },
  (table) => ({
    // One mapping per local field
    localFieldUq: uniqueIndex('mdm_metadata_mapping_local_uq').on(
      table.tenantId,
      table.localSystem,
      table.localEntity,
      table.localField,
    ),

    // Find all mappings for a canonical field
    canonicalKeyIdx: index('mdm_metadata_mapping_canonical_key_idx').on(
      table.tenantId,
      table.canonicalKey,
    ),

    // Filter by source system
    systemIdx: index('mdm_metadata_mapping_system_idx').on(
      table.tenantId,
      table.localSystem,
    ),
  }),
);

// Types
export type MDMMetadataMappingTable = typeof mdmMetadataMapping.$inferSelect;
export type InsertMDMMetadataMapping = typeof mdmMetadataMapping.$inferInsert;
