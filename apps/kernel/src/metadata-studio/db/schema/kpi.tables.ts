// metadata-studio/db/schema/kpi.tables.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { mdmGlobalMetadata } from './metadata.tables';

/**
 * mdm_kpi_definition
 *
 * Canonical KPI definition per tenant.
 * Tied conceptually to one primary output field (metadata),
 * but can depend on multiple source fields/components.
 */
export const mdmKpiDefinition = pgTable(
  'mdm_kpi_definition',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    tenantId: uuid('tenant_id').notNull(),

    canonicalKey: text('canonical_key').notNull(), // e.g. 'revenue_growth_yoy'

    name: text('name').notNull(),
    description: text('description'),

    domain: text('domain').notNull(),   // e.g. 'finance'
    category: text('category').notNull(), // e.g. 'Performance', 'Liquidity'

    standardPackId: text('standard_pack_id'), // e.g. IFRS_CORE, INTERNAL_PERF

    tier: text('tier').notNull(),       // 'tier1'..'tier5'
    status: text('status').notNull().default('active'), // 'active' | 'deprecated' | 'draft'

    // Expression for the KPI (DSL, SQL, etc.)
    expression: text('expression').notNull(),
    expressionLanguage: text('expression_language')
      .notNull()
      .default('METADATA_DSL'), // 'SQL' | 'DAX' | 'PYTHON' | etc.

    // Primary metric field (output) – semantic anchor
    primaryMetadataId: uuid('primary_metadata_id').references(
      () => mdmGlobalMetadata.id,
    ),
    primaryMetadataCanonicalKey: text(
      'primary_metadata_canonical_key',
    ),

    // e.g. 'ORG', 'BU', 'OUTLET', 'FRANCHISE'
    aggregationLevel: text('aggregation_level'),

    ownerId: text('owner_id').notNull(),
    stewardId: text('steward_id').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by').notNull(),
  },
  (table) => ({
    tenantCanonicalUq: uniqueIndex('mdm_kpi_tenant_canonical_uq').on(
      table.tenantId,
      table.canonicalKey,
    ),
    tenantDomainIdx: index('mdm_kpi_tenant_domain_idx').on(
      table.tenantId,
      table.domain,
      table.category,
    ),
  }),
);

/**
 * mdm_kpi_component
 *
 * Links KPI definitions to underlying metadata fields.
 */
export const mdmKpiComponent = pgTable(
  'mdm_kpi_component',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    tenantId: uuid('tenant_id').notNull(),

    kpiId: uuid('kpi_id')
      .notNull()
      .references(() => mdmKpiDefinition.id),

    // 'MEASURE' | 'DIMENSION' | 'FILTER' | 'DRIVER' | 'THRESHOLD' | 'OTHER'
    role: text('role').notNull(),

    metadataId: uuid('metadata_id')
      .notNull()
      .references(() => mdmGlobalMetadata.id),
    metadataCanonicalKey: text('metadata_canonical_key').notNull(),

    // Optional expression specific to this component's contribution
    componentExpression: text('component_expression'),

    sequence: integer('sequence').notNull().default(0),
    isRequired: boolean('is_required').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by').notNull(),
  },
  (table) => ({
    tenantKpiComponentUq: uniqueIndex('mdm_kpi_component_uq').on(
      table.tenantId,
      table.kpiId,
      table.role,
      table.metadataId,
    ),
    tenantKpiIdx: index('mdm_kpi_component_kpi_idx').on(
      table.tenantId,
      table.kpiId,
    ),
    tenantMetadataIdx: index('mdm_kpi_component_metadata_idx').on(
      table.tenantId,
      table.metadataId,
    ),
  }),
);

// Types
export type KpiDefinitionTable = typeof mdmKpiDefinition.$inferSelect;
export type InsertKpiDefinition = typeof mdmKpiDefinition.$inferInsert;
export type KpiComponentTable = typeof mdmKpiComponent.$inferSelect;
export type InsertKpiComponent = typeof mdmKpiComponent.$inferInsert;

