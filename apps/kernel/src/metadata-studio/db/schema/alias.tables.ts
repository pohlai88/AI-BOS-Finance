// metadata-studio/db/schema/alias.tables.ts

import { pgTable, uuid, text, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';

/**
 * Alias Table
 * 
 * Context-aware aliases mapping business terms to canonical concepts.
 * 
 * Example: "Sales" can mean different things in different contexts:
 * - FINANCIAL_REPORTING → revenue_ifrs_core (SECONDARY_LABEL)
 * - MANAGEMENT_REPORTING → sales_value_operational (PRIMARY_LABEL)
 * - STATUTORY_DISCLOSURE → FORBIDDEN (too ambiguous)
 * 
 * This makes aliases safe by governing their usage per context.
 */
export const mdmAlias = pgTable(
  'mdm_alias',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // The alias text (e.g., "Sales", "Revenue", "Income")
    aliasText: text('alias_text').notNull(),
    
    // Which canonical concept this maps to
    conceptId: uuid('concept_id'), // Nullable for FORBIDDEN aliases
    canonicalKey: text('canonical_key').notNull(),
    
    // Context and strength
    language: text('language').notNull().default('en'),
    contextDomain: text('context_domain')
      .$type<'FINANCIAL_REPORTING' | 'MANAGEMENT_REPORTING' | 'OPERATIONS' | 'STATUTORY_DISCLOSURE' | 'GENERIC_SPEECH'>()
      .notNull(),
    strength: text('strength')
      .$type<'PRIMARY_LABEL' | 'SECONDARY_LABEL' | 'DISCOURAGED' | 'FORBIDDEN'>()
      .notNull(),
    sourceSystem: text('source_system').notNull().default('AIBOS'),
    
    // Optional notes
    notes: text('notes'),
    
    // Active flag
    isActive: boolean('is_active').notNull().default(true),
    
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: one meaning per (alias, canonical_key, context, source)
    aliasConceptContextUnique: uniqueIndex('mdm_alias_text_key_context_source_idx').on(
      table.aliasText,
      table.canonicalKey,
      table.contextDomain,
      table.sourceSystem,
    ),
    // Indexes for fast lookups
    aliasTextIdx: index('mdm_alias_text_idx').on(table.aliasText),
    canonicalKeyIdx: index('mdm_alias_canonical_key_idx').on(table.canonicalKey),
    contextIdx: index('mdm_alias_context_idx').on(table.contextDomain),
    strengthIdx: index('mdm_alias_strength_idx').on(table.strength),
  }),
);

export type Alias = typeof mdmAlias.$inferSelect;
export type NewAlias = typeof mdmAlias.$inferInsert;

/**
 * Valid context domains
 */
export const CONTEXT_DOMAINS = [
  'FINANCIAL_REPORTING',
  'MANAGEMENT_REPORTING',
  'OPERATIONS',
  'STATUTORY_DISCLOSURE',
  'GENERIC_SPEECH',
] as const;

export type ContextDomain = (typeof CONTEXT_DOMAINS)[number];

/**
 * Alias strength levels
 */
export const ALIAS_STRENGTHS = [
  'PRIMARY_LABEL',
  'SECONDARY_LABEL',
  'DISCOURAGED',
  'FORBIDDEN',
] as const;

export type AliasStrength = (typeof ALIAS_STRENGTHS)[number];

/**
 * Helper to check if alias is allowed in a context
 */
export function isAliasAllowed(strength: AliasStrength): boolean {
  return strength === 'PRIMARY_LABEL' || strength === 'SECONDARY_LABEL';
}

/**
 * Helper to get warning message for discouraged/forbidden aliases
 */
export function getAliasWarning(
  aliasText: string,
  strength: AliasStrength,
  contextDomain: ContextDomain,
  canonicalKey?: string,
): string | null {
  switch (strength) {
    case 'FORBIDDEN':
      return `"${aliasText}" is FORBIDDEN in ${contextDomain}. ${
        canonicalKey ? `Use "${canonicalKey}" instead.` : 'Do not use this term.'
      }`;
    case 'DISCOURAGED':
      return `"${aliasText}" is DISCOURAGED in ${contextDomain}. ${
        canonicalKey ? `Prefer "${canonicalKey}" for clarity.` : 'Use with caution.'
      }`;
    default:
      return null;
  }
}

