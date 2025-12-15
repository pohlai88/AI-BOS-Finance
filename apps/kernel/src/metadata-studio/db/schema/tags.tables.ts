// metadata-studio/db/schema/tags.tables.ts
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const mdmTag = pgTable(
  'mdm_tag',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    tenantId: uuid('tenant_id').notNull(),

    // Internal key, stable & unique per tenant
    key: text('key').notNull(), // e.g. 'finance_performance', 'risk_critical'
    label: text('label').notNull(),
    description: text('description'),

    category: text('category').notNull(), // e.g. 'Domain', 'Risk', 'Business'

    // Optional SoT binding for finance/regulatory tags
    standardPackId: text('standard_pack_id'),

    status: text('status').notNull().default('active'), // 'active' | 'inactive'
    isSystem: boolean('is_system').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by').notNull(),
  },
  (table) => ({
    tenantKeyUq: uniqueIndex('mdm_tag_tenant_key_uq').on(
      table.tenantId,
      table.key,
    ),
    tenantCategoryIdx: index('mdm_tag_tenant_category_idx').on(
      table.tenantId,
      table.category,
    ),
  }),
);

/**
 * Tag assignment to targets:
 * - For now we support GLOBAL_METADATA & GLOSSARY.
 * - Later we can add KPI, SERVICE, REPORT, etc.
 */
export const mdmTagAssignment = pgTable(
  'mdm_tag_assignment',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    tenantId: uuid('tenant_id').notNull(),

    tagId: uuid('tag_id')
      .notNull()
      .references(() => mdmTag.id),

    targetType: text('target_type').notNull(), // 'GLOBAL_METADATA' | 'GLOSSARY' | 'KPI' | ...

    // Use canonicalKey for now; later can support URNs as well
    targetCanonicalKey: text('target_canonical_key').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').notNull(),
  },
  (table) => ({
    tenantAssignmentUq: uniqueIndex('mdm_tag_assignment_uq').on(
      table.tenantId,
      table.tagId,
      table.targetType,
      table.targetCanonicalKey,
    ),
    tenantTargetIdx: index('mdm_tag_assignment_target_idx').on(
      table.tenantId,
      table.targetType,
      table.targetCanonicalKey,
    ),
  }),
);

// Types
export type TagTable = typeof mdmTag.$inferSelect;
export type InsertTag = typeof mdmTag.$inferInsert;
export type TagAssignmentTable = typeof mdmTagAssignment.$inferSelect;
export type InsertTagAssignment = typeof mdmTagAssignment.$inferInsert;

