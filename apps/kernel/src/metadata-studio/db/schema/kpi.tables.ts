// metadata-studio/db/schema/kpi.tables.ts
// =============================================================================
// COMPOSITE KPI TABLES - Numerator/Denominator KPI definitions
// Derived from: .tempo/kpi/types.ts (GRCD v4.1.0 Compliant)
// =============================================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
} from 'drizzle-orm/pg-core';

// -----------------------------------------------------------------------------
// MDM Composite KPI - KPI definitions with numerator/denominator
// -----------------------------------------------------------------------------
export const mdmCompositeKpi = pgTable(
  'mdm_composite_kpi',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),

    // Unique identifier (e.g., "revenue_margin", "inventory_turnover")
    canonicalKey: varchar('canonical_key', { length: 255 }).notNull(),

    // Display name
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    // Numerator component
    // { fieldId, expression, standardPackId, description }
    numerator: jsonb('numerator').notNull(),

    // Denominator component
    // { fieldId, expression, standardPackId, description }
    denominator: jsonb('denominator').notNull(),

    // Governance
    governanceTier: varchar('governance_tier', { length: 20 })
      .notNull()
      .default('tier3'),
    standardPackId: uuid('standard_pack_id'),

    // Ownership
    ownerId: uuid('owner_id'),
    stewardId: uuid('steward_id'),

    // URN for lineage
    entityUrn: varchar('entity_urn', { length: 512 }),

    // Classification
    domain: varchar('domain', { length: 100 }),
    tags: jsonb('tags').default([]),

    // Status
    isActive: boolean('is_active').notNull().default(true),
    isDeprecated: boolean('is_deprecated').notNull().default(false),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_composite_kpi_tenant').on(table.tenantId),
    index('idx_composite_kpi_canonical').on(table.canonicalKey),
    index('idx_composite_kpi_domain').on(table.domain),
    index('idx_composite_kpi_tier').on(table.governanceTier),
  ]
);

// -----------------------------------------------------------------------------
// Type Exports
// -----------------------------------------------------------------------------
export type MdmCompositeKpi = typeof mdmCompositeKpi.$inferSelect;
export type MdmCompositeKpiInsert = typeof mdmCompositeKpi.$inferInsert;
