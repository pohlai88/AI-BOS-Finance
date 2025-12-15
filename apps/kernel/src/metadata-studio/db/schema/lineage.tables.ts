// metadata-studio/db/schema/lineage.tables.ts
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { mdmGlobalMetadata } from './metadata.tables';

/**
 * mdm_lineage_field
 *
 * Field-level lineage edges:
 *   source_metadata_id  →  target_metadata_id
 *
 * Used to trace how Tier 1 KPIs / fields derive from source
 * transactions, staging tables, or upstream systems.
 */
export const mdmLineageField = pgTable(
  'mdm_lineage_field',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    tenantId: uuid('tenant_id').notNull(),

    // FK to mdm_global_metadata (source side: upstream field)
    sourceMetadataId: uuid('source_metadata_id')
      .notNull()
      .references(() => mdmGlobalMetadata.id),

    // FK to mdm_global_metadata (target side: downstream field)
    targetMetadataId: uuid('target_metadata_id')
      .notNull()
      .references(() => mdmGlobalMetadata.id),

    /**
     * Relationship semantics, e.g.:
     * - 'direct'       → 1:1 copied from source
     * - 'derived'      → transformed with formula
     * - 'aggregated'   → sum/avg/min/max over source
     * - 'lookup'       → enriched via dimension/lookup
     * - 'manual'       → manually curated
     */
    relationshipType: text('relationship_type').notNull(),

    /**
     * Optional higher-level transformation classification:
     * e.g. 'aggregation', 'fx_translation', 'allocation', 'join'
     */
    transformationType: text('transformation_type'),

    /**
     * Optional human-readable / machine-readable expression:
     * e.g. "SUM(sales.amount)", "amount * fx_rate"
     */
    transformationExpression: text('transformation_expression'),

    // Whether this edge is considered part of the primary path
    isPrimaryPath: boolean('is_primary_path').notNull().default(true),

    // 0–100 confidence (used for audit / quality)
    confidenceScore: integer('confidence_score').notNull().default(100),

    // Governance / verification
    verified: boolean('verified').notNull().default(false),
    verifiedBy: text('verified_by'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by').notNull(),
  },
  (table) => ({
    // One logical edge per tenant + source + target + relationshipType
    tenantEdgeUq: uniqueIndex('mdm_lineage_field_edge_uq').on(
      table.tenantId,
      table.sourceMetadataId,
      table.targetMetadataId,
      table.relationshipType,
    ),

    tenantTargetIdx: index('mdm_lineage_field_target_idx').on(
      table.tenantId,
      table.targetMetadataId,
    ),

    tenantSourceIdx: index('mdm_lineage_field_source_idx').on(
      table.tenantId,
      table.sourceMetadataId,
    ),
  }),
);

// Types
export type LineageFieldTable = typeof mdmLineageField.$inferSelect;
export type InsertLineageField = typeof mdmLineageField.$inferInsert;

