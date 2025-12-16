// metadata-studio/db/schema/lineage.tables.ts
// =============================================================================
// LINEAGE TABLES - Graph-based lineage tracking for metadata assets
// Derived from: .tempo/lineage/types.ts (GRCD v4.1.0 Compliant)
// =============================================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

// -----------------------------------------------------------------------------
// Lineage Node Types
// -----------------------------------------------------------------------------
export const lineageNodeTypes = [
  'field',
  'entity',
  'kpi',
  'report',
  'transformation',
  'source',
] as const;

export type LineageNodeType = (typeof lineageNodeTypes)[number];

// -----------------------------------------------------------------------------
// Lineage Edge Types
// -----------------------------------------------------------------------------
export const lineageEdgeTypes = [
  'produces',
  'consumes',
  'derived_from',
  'transforms',
  'references',
] as const;

export type LineageEdgeType = (typeof lineageEdgeTypes)[number];

// -----------------------------------------------------------------------------
// MDM Lineage Node - Nodes in the lineage graph
// -----------------------------------------------------------------------------
export const mdmLineageNode = pgTable(
  'mdm_lineage_node',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),

    // URN is the unique identifier for lineage (e.g., "urn:metadata:field:finance.revenue")
    urn: varchar('urn', { length: 512 }).notNull(),

    // Node type (field, entity, kpi, report, transformation, source)
    nodeType: varchar('node_type', { length: 50 }).notNull(),

    // Reference to the actual entity (field, entity, kpi, etc.)
    entityId: uuid('entity_id'),
    entityType: varchar('entity_type', { length: 100 }), // 'mdm_global_metadata', 'mdm_entity_catalog', 'mdm_composite_kpi'

    // Display info
    label: varchar('label', { length: 255 }),
    description: text('description'),

    // Flexible metadata (e.g., source system, schema, etc.)
    metadata: jsonb('metadata').default({}),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_lineage_node_tenant').on(table.tenantId),
    index('idx_lineage_node_urn').on(table.urn),
    index('idx_lineage_node_type').on(table.nodeType),
    index('idx_lineage_node_entity').on(table.entityId, table.entityType),
  ]
);

// -----------------------------------------------------------------------------
// MDM Lineage Edge - Edges connecting nodes in the lineage graph
// -----------------------------------------------------------------------------
export const mdmLineageEdge = pgTable(
  'mdm_lineage_edge',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),

    // Source and target URNs
    sourceUrn: varchar('source_urn', { length: 512 }).notNull(),
    targetUrn: varchar('target_urn', { length: 512 }).notNull(),

    // Edge type (produces, consumes, derived_from, transforms, references)
    edgeType: varchar('edge_type', { length: 50 }).notNull(),

    // Optional transformation description (SQL, expression, or plain text)
    transformation: text('transformation'),

    // Flexible metadata
    metadata: jsonb('metadata').default({}),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_lineage_edge_tenant').on(table.tenantId),
    index('idx_lineage_edge_source').on(table.sourceUrn),
    index('idx_lineage_edge_target').on(table.targetUrn),
    index('idx_lineage_edge_type').on(table.edgeType),
  ]
);

// -----------------------------------------------------------------------------
// Type Exports
// -----------------------------------------------------------------------------
export type MdmLineageNode = typeof mdmLineageNode.$inferSelect;
export type MdmLineageNodeInsert = typeof mdmLineageNode.$inferInsert;
export type MdmLineageEdge = typeof mdmLineageEdge.$inferSelect;
export type MdmLineageEdgeInsert = typeof mdmLineageEdge.$inferInsert;
