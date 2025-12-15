// metadata-studio/db/schema/auto-apply.tables.ts

import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  index,
} from 'drizzle-orm/pg-core';

/**
 * mdm_change_history
 * 
 * GRCD Phase 3: Rollback Support
 * 
 * Stores complete change history for all metadata modifications,
 * enabling rollback of auto-applied changes.
 */
export const mdmChangeHistory = pgTable(
  'mdm_change_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    
    // What was changed
    entityType: text('entity_type')
      .$type<'GLOBAL_METADATA' | 'BUSINESS_RULE' | 'KPI' | 'GLOSSARY' | 'LINEAGE' | 'NAMING_POLICY'>()
      .notNull(),
    entityId: uuid('entity_id').notNull(),
    entityKey: text('entity_key'),
    
    // Change details
    changeType: text('change_type')
      .$type<'create' | 'update' | 'delete'>()
      .notNull(),
    
    // Before/after snapshots for rollback
    previousState: jsonb('previous_state'),
    newState: jsonb('new_state').notNull(),
    
    // Change metadata
    changedFields: jsonb('changed_fields').$type<string[]>(),
    
    // Who/what made the change
    changedBy: text('changed_by').notNull(),
    changeSource: text('change_source')
      .$type<'human' | 'agent_auto' | 'agent_approved' | 'system' | 'migration'>()
      .notNull(),
    agentType: text('agent_type'),
    proposalId: uuid('proposal_id'),
    
    // Rollback status
    isRolledBack: boolean('is_rolled_back').notNull().default(false),
    rolledBackAt: timestamp('rolled_back_at', { withTimezone: true }),
    rolledBackBy: text('rolled_back_by'),
    rollbackReason: text('rollback_reason'),
    
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantEntityIdx: index('mdm_change_history_tenant_entity_idx').on(
      table.tenantId,
      table.entityType,
      table.entityId,
    ),
    changeSourceIdx: index('mdm_change_history_source_idx').on(table.changeSource),
    createdAtIdx: index('mdm_change_history_created_at_idx').on(table.createdAt),
  }),
);

export type ChangeHistory = typeof mdmChangeHistory.$inferSelect;
export type InsertChangeHistory = typeof mdmChangeHistory.$inferInsert;

/**
 * mdm_auto_apply_config
 * 
 * GRCD Phase 3: Auto-Apply Configuration
 * 
 * Defines guardrails and thresholds for automatic change application.
 */
export const mdmAutoApplyConfig = pgTable(
  'mdm_auto_apply_config',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    
    // What this config applies to
    entityType: text('entity_type')
      .$type<'GLOBAL_METADATA' | 'BUSINESS_RULE' | 'KPI' | 'GLOSSARY' | 'LINEAGE' | 'ALL'>()
      .notNull(),
    agentType: text('agent_type'), // Null = applies to all agents
    
    // Guardrails
    enabled: boolean('enabled').notNull().default(false),
    minConfidenceScore: integer('min_confidence_score').notNull().default(95),
    maxRiskLevel: text('max_risk_level')
      .$type<'minimal' | 'low'>()
      .notNull()
      .default('minimal'),
    allowedTiers: jsonb('allowed_tiers')
      .$type<string[]>()
      .notNull()
      .default(['tier4', 'tier5']),
    allowedActions: jsonb('allowed_actions')
      .$type<string[]>()
      .notNull()
      .default(['update', 'flag']),
    
    // Rate limits
    maxAutoAppliesPerHour: integer('max_auto_applies_per_hour').notNull().default(10),
    maxAutoAppliesPerDay: integer('max_auto_applies_per_day').notNull().default(50),
    
    // Cooldown period after errors
    cooldownMinutesOnError: integer('cooldown_minutes_on_error').notNull().default(60),
    
    // Require specific conditions
    requireReversible: boolean('require_reversible').notNull().default(true),
    requireNoActiveViolations: boolean('require_no_active_violations').notNull().default(true),
    
    // Audit
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantEntityAgentIdx: index('mdm_auto_apply_config_tenant_idx').on(
      table.tenantId,
      table.entityType,
      table.agentType,
    ),
  }),
);

export type AutoApplyConfig = typeof mdmAutoApplyConfig.$inferSelect;
export type InsertAutoApplyConfig = typeof mdmAutoApplyConfig.$inferInsert;

/**
 * mdm_agent_performance
 * 
 * GRCD Phase 3: Tier Promotion Engine
 * 
 * Tracks agent performance for autonomy tier upgrades.
 */
export const mdmAgentPerformance = pgTable(
  'mdm_agent_performance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    
    // Agent identity
    agentType: text('agent_type')
      .$type<'data_quality_sentinel' | 'schema_drift_detector' | 'lineage_analyzer' | 'naming_validator'>()
      .notNull(),
    
    // Current autonomy level
    currentTier: text('current_tier')
      .$type<'tier0' | 'tier1' | 'tier2' | 'tier3'>()
      .notNull()
      .default('tier1'),
    
    // Performance metrics (rolling 30 days)
    totalProposals: integer('total_proposals').notNull().default(0),
    approvedProposals: integer('approved_proposals').notNull().default(0),
    rejectedProposals: integer('rejected_proposals').notNull().default(0),
    autoAppliedChanges: integer('auto_applied_changes').notNull().default(0),
    rolledBackChanges: integer('rolled_back_changes').notNull().default(0),
    
    // Quality metrics
    avgConfidenceScore: integer('avg_confidence_score'),
    helpfulFeedbackCount: integer('helpful_feedback_count').notNull().default(0),
    notHelpfulFeedbackCount: integer('not_helpful_feedback_count').notNull().default(0),
    
    // Tier promotion tracking
    lastPromotionAt: timestamp('last_promotion_at', { withTimezone: true }),
    lastDemotionAt: timestamp('last_demotion_at', { withTimezone: true }),
    promotionEligibleAt: timestamp('promotion_eligible_at', { withTimezone: true }),
    
    // Error tracking
    consecutiveErrors: integer('consecutive_errors').notNull().default(0),
    lastErrorAt: timestamp('last_error_at', { withTimezone: true }),
    
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantAgentIdx: index('mdm_agent_performance_tenant_agent_idx').on(
      table.tenantId,
      table.agentType,
    ),
  }),
);

export type AgentPerformance = typeof mdmAgentPerformance.$inferSelect;
export type InsertAgentPerformance = typeof mdmAgentPerformance.$inferInsert;

/**
 * mdm_compliance_check
 * 
 * GRCD Phase 3: Compliance Orchestra
 * 
 * Tracks continuous compliance monitoring results.
 */
export const mdmComplianceCheck = pgTable(
  'mdm_compliance_check',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    
    // What standard was checked
    standard: text('standard')
      .$type<'MFRS' | 'IFRS' | 'GDPR' | 'PDPA' | 'SOC2' | 'ISO27001'>()
      .notNull(),
    scope: text('scope').notNull(), // e.g., 'FINANCE', 'HR', 'ALL'
    
    // Check results
    status: text('status')
      .$type<'compliant' | 'non_compliant' | 'partially_compliant' | 'not_applicable'>()
      .notNull(),
    coveragePercent: integer('coverage_percent').notNull(),
    
    // Findings
    findings: jsonb('findings').$type<ComplianceFinding[]>().notNull().default([]),
    
    // Remediation
    remediationRequired: boolean('remediation_required').notNull().default(false),
    remediationDeadline: timestamp('remediation_deadline', { withTimezone: true }),
    remediationStatus: text('remediation_status')
      .$type<'not_started' | 'in_progress' | 'completed' | 'overdue'>(),
    
    // Check metadata
    checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
    checkedBy: text('checked_by').notNull(), // 'system' or user ID
    nextCheckAt: timestamp('next_check_at', { withTimezone: true }),
  },
  (table) => ({
    tenantStandardIdx: index('mdm_compliance_check_tenant_standard_idx').on(
      table.tenantId,
      table.standard,
    ),
    statusIdx: index('mdm_compliance_check_status_idx').on(table.status),
  }),
);

export interface ComplianceFinding {
  code: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedEntities: string[];
  recommendation: string;
}

export type ComplianceCheck = typeof mdmComplianceCheck.$inferSelect;
export type InsertComplianceCheck = typeof mdmComplianceCheck.$inferInsert;

