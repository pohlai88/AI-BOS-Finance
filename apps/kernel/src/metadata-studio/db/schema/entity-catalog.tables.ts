import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * mdm_entity_catalog
 *
 * Entity Registry: Catalog of all entities (tables, views, APIs, screens).
 * This is part of the CONT_06 Metadata Registry.
 *
 * GRCD Rule: No entity without catalog entry.
 * All entity_urn values in mdm_global_metadata MUST exist here.
 *
 * @see CONT_06_SCHEMA_SPEC.md Section 1.2
 */
export const mdmEntityCatalog = pgTable(
  'mdm_entity_catalog',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Multi-tenant isolation
    tenantId: uuid('tenant_id').notNull(),

    // Unique entity URN (e.g., finance.journal_entries)
    entityUrn: text('entity_urn').notNull(),

    // Human-readable name
    entityName: text('entity_name').notNull(),

    // Type: table, view, api, screen, report
    entityType: text('entity_type').notNull(),

    // Business domain (kernel, finance, hr)
    domain: text('domain').notNull(),

    // Module within domain (iam, gl, ap)
    module: text('module').notNull(),

    // Source system (erp, external, etc.)
    system: text('system'),

    // Criticality level (critical, high, medium, low)
    criticality: text('criticality'),

    // Lifecycle status (draft, active, deprecated)
    lifecycleStatus: text('lifecycle_status').notNull().default('active'),

    // Entity description
    description: text('description'),

    // Owner (governance)
    ownerId: text('owner_id'),

    // Audit columns
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
  },
  (table) => ({
    // One entity per URN per tenant
    tenantEntityUrnUq: uniqueIndex('mdm_entity_catalog_tenant_urn_uq').on(
      table.tenantId,
      table.entityUrn,
    ),

    // Domain/module filtering
    domainModuleIdx: index('mdm_entity_catalog_domain_module_idx').on(
      table.tenantId,
      table.domain,
      table.module,
    ),

    // Type filtering
    typeIdx: index('mdm_entity_catalog_type_idx').on(
      table.tenantId,
      table.entityType,
    ),
  }),
);

// Types
export type MDMEntityCatalogTable = typeof mdmEntityCatalog.$inferSelect;
export type InsertMDMEntityCatalog = typeof mdmEntityCatalog.$inferInsert;
