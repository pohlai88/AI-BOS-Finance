import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * mdm_standard_pack
 *
 * Global SoT packs for standards like IFRS, IAS, MFRS, HL7, GS1, etc.
 * These are *not* per-tenant; they are global references.
 */
export const mdmStandardPack = pgTable(
  'mdm_standard_pack',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // e.g. 'IFRS_CORE', 'IAS_2_INV', 'IFRS_15_REV'
    packId: text('pack_id').notNull(),

    // Human-friendly label: 'IFRS Core Framework', 'IAS 2 Inventories'
    packName: text('pack_name').notNull(),

    // Semver or standard version: '1.0.0', '2018', etc.
    version: text('version').notNull(),

    // Optional description of scope
    description: text('description'),

    // High-level area: 'finance', 'tax', 'healthcare', 'logistics', etc.
    category: text('category').notNull(),

    // Governance tier this pack generally sits in: 'tier1' | 'tier2' | ...
    tier: text('tier').notNull(),

    // active | deprecated | draft
    status: text('status').notNull().default('active'),

    // True if this pack is the primary SoT for its category
    isPrimary: boolean('is_primary').notNull().default(false),

    // Standard issuing body: 'IFRS', 'IASB', 'MFRS', 'HL7', 'GS1', etc.
    standardBody: text('standard_body').notNull(),

    // Optional reference: 'IAS 2.9', 'IFRS 15.31' etc.
    standardReference: text('standard_reference'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

    // Who registered this pack in the system
    createdBy: text('created_by').notNull(),
  },
  (table) => ({
    // So you can't accidentally define the same pack twice
    packIdUnique: uniqueIndex('mdm_standard_pack_pack_id_uq').on(table.packId),

    // For faster lookup by category/tier
    categoryTierIdx: index('mdm_standard_pack_category_tier_idx').on(
      table.category,
      table.tier,
    ),

    primaryPackIdx: index('mdm_standard_pack_primary_idx').on(
      table.category,
      table.isPrimary,
    ),
  }),
);

// Types
export type StandardPackTable = typeof mdmStandardPack.$inferSelect;
export type InsertStandardPack = typeof mdmStandardPack.$inferInsert;

