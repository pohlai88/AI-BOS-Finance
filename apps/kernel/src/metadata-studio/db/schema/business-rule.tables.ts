// metadata-studio/db/schema/business-rule.tables.ts
import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * mdm_business_rule
 *
 * Soft-configuration engine for "fast frontlines".
 * Stores rule definitions as JSONB with strong structure enforced by Zod.
 *
 * Examples:
 * - FINANCE_APPROVAL: expense auto-approval thresholds
 * - KPI_DEFINITION: KPI formula + display config
 * - WORKFLOW_RULE: which approval path to take
 */
export const mdmBusinessRule = pgTable(
  'mdm_business_rule',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Tenant isolation
    tenantId: uuid('tenant_id').notNull(),

    /**
     * Rule "family" or type.
     * e.g. 'FINANCE_APPROVAL', 'KPI_DEFINITION', 'WORKFLOW_RULE'
     * Used to pick the correct Zod schema for configuration.
     */
    ruleType: text('rule_type').notNull(),

    /**
     * Stable key within a rule_type.
     * e.g. 'expense_auto_approval', 'revenue_growth_kpi'
     */
    key: text('key').notNull(),

    // Human-friendly name & description
    name: text('name').notNull(),
    description: text('description'),

    // Governance tier: 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5'
    tier: text('tier').notNull(),

    // Lane: how this rule is governed
    // 'kernel_only' | 'governed' | 'draft'
    lane: text('lane').notNull(),

    // Environment: 'live' (prod) or 'sandbox' (experiments)
    environment: text('environment').notNull().default('live'),

    /**
     * The actual rule configuration, validated by Zod in the service layer.
     * Shape depends on ruleType:
     * - FINANCE_APPROVAL -> FinanceApprovalConfigSchema
     * - KPI_DEFINITION   -> KpiDefinitionConfigSchema
     */
    configuration: jsonb('configuration').notNull(),

    // Version of this rule definition (semantic or simple string)
    version: text('version').notNull().default('1.0.0'),

    // Status flags
    isActive: boolean('is_active').notNull().default(true),
    isDraft: boolean('is_draft').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by').notNull(),
  },
  (table) => ({
    /**
     * Unique per tenant per version per environment.
     * This lets you have:
     * - live v1.0.0
     * - live v1.1.0
     * - sandbox vX for experiments
     */
    tenantRuleVersionUq: uniqueIndex(
      'mdm_business_rule_tenant_rule_version_uq',
    ).on(
      table.tenantId,
      table.ruleType,
      table.key,
      table.environment,
      table.version,
    ),

    // Fast lookup for active rules in a given environment
    activeRuleIdx: index('mdm_business_rule_active_idx').on(
      table.tenantId,
      table.ruleType,
      table.environment,
      table.isActive,
    ),

    // Helpful for governance queries (e.g. "all tier1 governed rules")
    tierLaneIdx: index('mdm_business_rule_tier_lane_idx').on(
      table.tenantId,
      table.tier,
      table.lane,
    ),
  }),
);

// Types
export type BusinessRuleTable = typeof mdmBusinessRule.$inferSelect;
export type InsertBusinessRule = typeof mdmBusinessRule.$inferInsert;

