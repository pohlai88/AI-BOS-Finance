// metadata-studio/db/schema/observability.tables.ts
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

/**
 * mdm_usage_log
 *
 * Tracks WHO used WHAT metadata, WHEN, and HOW.
 * Critical for:
 * - Tier1/2 access auditing (regulatory compliance)
 * - Usage analytics (which fields are most accessed?)
 * - Access patterns (human vs agent vs system)
 * - Governance monitoring (who's touching critical data?)
 */
export const mdmUsageLog = pgTable(
  'mdm_usage_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    tenantId: text('tenant_id').notNull(),
    entityUrn: text('entity_urn').notNull(), // e.g. "gl.account:cash_and_cash_equivalents"
    conceptId: uuid('concept_id'), // optional link back to mdm_global_metadata

    // WHO
    actorId: text('actor_id').notNull(),
    actorType: text('actor_type').$type<'HUMAN' | 'AGENT' | 'SYSTEM'>().notNull(),

    // WHAT ACTION
    eventType: text('event_type')
      .$type<
        | 'read'    // view
        | 'query'   // query
        | 'export'  // export
        | 'write'   // update
        | 'download'
      >()
      .notNull(),

    // WHEN
    usedAt: timestamp('used_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Context / metadata (request origin, filters, etc.)
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull(),

    // Governance context (optional but useful)
    governanceTier: text('governance_tier').$type<'T1' | 'T2' | 'T3' | 'T4' | 'T5'>(),
    source: text('source'), // e.g. "bff", "kernel", "mcp"
  },
  (table) => ({
    byTenantEntityTime: index('idx_usage_tenant_entity_time').on(
      table.tenantId,
      table.entityUrn,
      table.usedAt,
    ),
    byConcept: index('idx_usage_concept').on(table.tenantId, table.conceptId),
    byActorType: index('idx_usage_actor_type').on(
      table.tenantId,
      table.actorType,
      table.usedAt,
    ),
  }),
);

/**
 * mdm_profile
 *
 * Stores data quality profiles for tables/KPIs/fields.
 * Contains:
 * - Statistical profiles (min, max, avg, stddev, percentiles)
 * - Quality metrics (completeness, uniqueness, validity)
 * - Distribution info (value frequencies, cardinality)
 * - Lineage hints (governance tier, SoT pack)
 *
 * Used for:
 * - Data quality dashboards
 * - Tier1 coverage validation
 * - Anomaly detection (profile drift)
 * - Audit readiness (show quality over time)
 */
export const mdmProfile = pgTable(
  'mdm_profile',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    tenantId: text('tenant_id').notNull(),
    entityUrn: text('entity_urn').notNull(), // usually table or KPI URN

    // Data profile payload (matches DataProfileSchema)
    profile: jsonb('profile').$type<Record<string, unknown>>().notNull(),

    // Quality rollups
    completeness: text('completeness'), // "0-100" as string or cast in app
    uniqueness: text('uniqueness'),
    validity: text('validity'),
    qualityScore: text('quality_score'),

    // Governance & lineage hints
    governanceTier: text('governance_tier').$type<'T1' | 'T2' | 'T3' | 'T4' | 'T5'>(),
    standardPackId: uuid('standard_pack_id'), // optional SoT link

    // Who / when
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    byTenantEntityTime: index('idx_profile_tenant_entity_time').on(
      table.tenantId,
      table.entityUrn,
      table.createdAt,
    ),
  }),
);

// Type exports
export type UsageLogRow = typeof mdmUsageLog.$inferSelect;
export type InsertUsageLog = typeof mdmUsageLog.$inferInsert;
export type ProfileRow = typeof mdmProfile.$inferSelect;
export type InsertProfile = typeof mdmProfile.$inferInsert;

