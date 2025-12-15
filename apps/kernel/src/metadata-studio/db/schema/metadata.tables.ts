import {
    pgTable,
    uuid,
    text,
    boolean,
    timestamp,
    index,
    uniqueIndex,
} from 'drizzle-orm/pg-core';
import { mdmStandardPack } from './standard-pack.tables';

/**
 * mdm_global_metadata
 *
 * Canonical metadata registry per tenant.
 * This is where each field/KPI/semantic concept is defined:
 * - canonical_key is unique per tenant
 * - tier controls governance
 * - standard_pack_id links to mdm_standard_pack (SoT)
 */
export const mdmGlobalMetadata = pgTable(
    'mdm_global_metadata',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        // Multi-tenant isolation
        tenantId: uuid('tenant_id').notNull(),

        // Canonical name for this concept, unique per tenant.
        // e.g. 'revenue_gross', 'inventory_raw_material', 'fx_gain_realized'
        canonicalKey: text('canonical_key').notNull(),

        // Human-facing label and description
        label: text('label').notNull(),
        description: text('description'),

        // Domain/module/entity for scoping: finance / gl / gl.journal
        domain: text('domain').notNull(),
        module: text('module').notNull(),
        entityUrn: text('entity_urn').notNull(),

        // Governance tier: 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5'
        tier: text('tier').notNull(),

        // Optional SoT pack reference (required for Tier1/2 in service logic)
        standardPackId: text('standard_pack_id').references(
            () => mdmStandardPack.packId,
        ),

        // Basic datatype + format (e.g. 'decimal', 'string', 'date', 'YYYY-MM-DD')
        dataType: text('data_type').notNull(),
        format: text('format'),

        // Raw aliases string (you can normalise later into a separate table)
        // e.g. "Revenue;Sales;Turnover"
        aliasesRaw: text('aliases_raw'),

        // Ownership & stewardship
        ownerId: text('owner_id').notNull(), // e.g. CFO, Head of Finance
        stewardId: text('steward_id').notNull(), // e.g. Data Steward / Controller

        // Status flags
        status: text('status').notNull().default('active'), // active | deprecated | draft
        isDraft: boolean('is_draft').notNull().default(false),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

        createdBy: text('created_by').notNull(),
        updatedBy: text('updated_by').notNull(),
    },
    (table) => ({
        // one canonical_key per tenant
        tenantCanonicalKeyUq: uniqueIndex(
            'mdm_global_metadata_tenant_canonical_key_uq',
        ).on(table.tenantId, table.canonicalKey),

        // help with filtering by domain/module
        domainModuleIdx: index('mdm_global_metadata_domain_module_idx').on(
            table.tenantId,
            table.domain,
            table.module,
        ),

        // quick filter for active Tier1/Tier2 metadata
        tierStatusIdx: index('mdm_global_metadata_tier_status_idx').on(
            table.tenantId,
            table.tier,
            table.status,
        ),
    }),
);

// Types
export type MDMGlobalMetadataTable = typeof mdmGlobalMetadata.$inferSelect;
export type InsertMDMGlobalMetadata = typeof mdmGlobalMetadata.$inferInsert;

