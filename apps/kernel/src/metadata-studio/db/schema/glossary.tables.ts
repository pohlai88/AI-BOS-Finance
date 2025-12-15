// metadata-studio/db/schema/glossary.tables.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const mdmGlossaryTerm = pgTable(
  'mdm_glossary_term',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    tenantId: uuid('tenant_id').notNull(),

    // One canonical key per concept per tenant
    canonicalKey: text('canonical_key').notNull(),

    // Human-facing term
    term: text('term').notNull(),
    description: text('description'),

    // For grouping / filtering in UI + APIs
    domain: text('domain').notNull(),   // e.g. 'finance', 'hr', 'inventory'
    category: text('category').notNull(), // e.g. 'Financial Performance'

    // Optional SoT pack binding (IFRS, HL7, etc.)
    standardPackId: text('standard_pack_id'),

    language: text('language').notNull().default('en'),

    // Tier1–5 (reuse governance tiers conceptually)
    tier: text('tier').notNull(), // 'tier1' | ... | 'tier5'

    // 'active' | 'deprecated' | 'draft'
    status: text('status').notNull().default('active'),

    // Comma-separated or pipe-separated synonyms, for now
    synonymsRaw: text('synonyms_raw'),

    // Optionally store related canonical keys (comma/pipe separated)
    relatedCanonicalKeys: text('related_canonical_keys'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by').notNull(),
  },
  (table) => ({
    tenantCanonicalUq: uniqueIndex(
      'mdm_glossary_tenant_canonical_uq',
    ).on(table.tenantId, table.canonicalKey),

    tenantTermIdx: index('mdm_glossary_term_idx').on(
      table.tenantId,
      table.term,
    ),
  }),
);

// Types
export type GlossaryTermTable = typeof mdmGlossaryTerm.$inferSelect;
export type InsertGlossaryTerm = typeof mdmGlossaryTerm.$inferInsert;

