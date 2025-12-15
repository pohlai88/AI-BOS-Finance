// metadata-studio/db/schema/naming-variant.tables.ts

import { pgTable, uuid, text, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Naming Variant Table
 * 
 * Stores different naming convention variants for metadata concepts.
 * 
 * SSOT Rule: canonical_key in mdm_global_metadata is ALWAYS snake_case.
 * This table stores generated variants (camelCase, PascalCase, etc.) per context.
 * 
 * Example:
 * - canonical_key: "receipt_outstanding_amount" (SSOT in mdm_global_metadata)
 * - Variants in this table:
 *   - context: "typescript", style: "camelCase", value: "receiptOutstandingAmount"
 *   - context: "graphql", style: "PascalCase", value: "ReceiptOutstandingAmount"
 *   - context: "const", style: "UPPER_SNAKE", value: "RECEIPT_OUTSTANDING_AMOUNT"
 *   - context: "api_path", style: "kebab-case", value: "receipt-outstanding-amount"
 */
export const mdmNamingVariant = pgTable(
    'mdm_naming_variant',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        // Reference to the concept (currently mdm_global_metadata, future: mdm_concept_global)
        conceptId: uuid('concept_id').notNull(),

        // Where this name is used
        context: text('context')
            .$type<'db' | 'typescript' | 'graphql' | 'api_path' | 'const' | 'bi' | 'tax'>()
            .notNull(),

        // Naming style
        style: text('style')
            .$type<'snake_case' | 'camelCase' | 'PascalCase' | 'UPPER_SNAKE' | 'kebab-case'>()
            .notNull(),

        // The actual variant value
        value: text('value').notNull(),

        // Whether this is the primary variant for this context
        isPrimary: boolean('is_primary').notNull().default(true),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        // Unique constraint: one variant per (concept, context, style)
        conceptContextStyleUnique: uniqueIndex('mdm_naming_variant_concept_context_style_idx').on(
            table.conceptId,
            table.context,
            table.style,
        ),
        // Additional indexes are created via SQL migration
    }),
);

export type NamingVariant = typeof mdmNamingVariant.$inferSelect;
export type NewNamingVariant = typeof mdmNamingVariant.$inferInsert;

/**
 * Valid naming contexts
 */
export const NAMING_CONTEXTS = [
    'db',
    'typescript',
    'graphql',
    'api_path',
    'const',
    'bi',
    'tax',
] as const;

export type NamingContext = (typeof NAMING_CONTEXTS)[number];

/**
 * Valid naming styles
 */
export const NAMING_STYLES = [
    'snake_case',
    'camelCase',
    'PascalCase',
    'UPPER_SNAKE',
    'kebab-case',
] as const;

export type NamingStyle = (typeof NAMING_STYLES)[number];

/**
 * Default style for each context
 */
export const DEFAULT_STYLE_BY_CONTEXT: Record<NamingContext, NamingStyle> = {
    db: 'snake_case',
    typescript: 'camelCase',
    graphql: 'PascalCase',
    api_path: 'kebab-case',
    const: 'UPPER_SNAKE',
    bi: 'snake_case',
    tax: 'snake_case',
};

