// metadata-studio/db/schema/alias.tables.ts
// =============================================================================
// ALIAS TABLES SCHEMA
// Stores alternative names/aliases for canonical metadata fields
// =============================================================================

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * mdm_alias
 * 
 * Stores alternative names/aliases for canonical metadata fields.
 * Allows searching by alias to find the canonical field.
 * 
 * Example:
 * - Canonical: 'revenue_gross'
 * - Aliases: 'Revenue', 'Sales', 'Turnover', 'Total Revenue'
 */
export const mdmAlias = pgTable(
  'mdm_alias',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Multi-tenant isolation
    tenantId: uuid('tenant_id'),

    // Reference to the canonical metadata field
    canonicalKey: text('canonical_key').notNull(),

    // Reference to the concept in mdm_global_metadata
    conceptId: uuid('concept_id'),

    // The alias/alternative name
    aliasText: text('alias_text').notNull(),

    // Context information
    contextDomain: text('context_domain'), // e.g., 'accounting', 'sales'
    sourceSystem: text('source_system'), // e.g., 'SAP', 'Salesforce'
    language: text('language').default('en'), // ISO language code

    // Alias strength/confidence
    strength: text('strength'), // e.g., 'strong', 'moderate', 'weak'

    // Additional metadata
    notes: text('notes'),
    isActive: boolean('is_active').default(true),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by'),
    updatedBy: text('updated_by'),
  },
  (table) => ({
    // Ensure alias is unique per tenant and context
    tenantAliasContextUq: uniqueIndex('mdm_alias_tenant_alias_context_uq').on(
      table.tenantId,
      table.aliasText,
      table.contextDomain,
      table.sourceSystem
    ),

    // Index for quick lookup by canonical key
    canonicalKeyIdx: index('mdm_alias_canonical_key_idx').on(
      table.tenantId,
      table.canonicalKey
    ),

    // Index for searching by alias
    aliasTextIdx: index('mdm_alias_alias_text_idx').on(
      table.tenantId,
      table.aliasText
    ),
  })
);

// Types
export type MDMAlias = typeof mdmAlias.$inferSelect;
export type InsertMDMAlias = typeof mdmAlias.$inferInsert;
