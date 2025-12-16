import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ============================================================================
// Violation Report Table
// ============================================================================

/**
 * mdm_violation_report
 *
 * Records GRCD violations found during metadata scans.
 * Each scan creates a new batch of violation records.
 */
export const mdmViolationReport = pgTable(
  'mdm_violation_report',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Multi-tenant isolation
    tenantId: uuid('tenant_id').notNull(),

    // Scan batch identifier
    scanId: uuid('scan_id').notNull(),

    // Violation details
    violationCode: text('violation_code').notNull(), // GRCD-12-VIOLATION, etc.
    severity: text('severity').notNull(), // critical, high, medium, low
    description: text('description').notNull(),

    // Affected entity
    targetTable: text('target_table').notNull(), // mdm_global_metadata, mdm_entity_catalog
    targetId: uuid('target_id'), // UUID of the affected row (if exists)
    targetKey: text('target_key').notNull(), // canonical_key or entity_urn

    // Additional context
    context: jsonb('context').$type<Record<string, unknown>>(),

    // Status
    status: text('status').notNull().default('open'), // open, remediated, ignored, wont_fix

    // Audit
    detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: text('resolved_by'),
  },
  (table) => ({
    // Index for querying by scan
    scanIdIdx: index('mdm_violation_report_scan_id_idx').on(table.scanId),

    // Index for querying by tenant and status
    tenantStatusIdx: index('mdm_violation_report_tenant_status_idx').on(
      table.tenantId,
      table.status,
    ),

    // Index for querying by violation code
    violationCodeIdx: index('mdm_violation_report_code_idx').on(
      table.tenantId,
      table.violationCode,
    ),
  }),
);

// Types
export type MDMViolationReportTable = typeof mdmViolationReport.$inferSelect;
export type InsertMDMViolationReport = typeof mdmViolationReport.$inferInsert;

// ============================================================================
// Remediation Proposal Table
// ============================================================================

/**
 * mdm_remediation_proposal
 *
 * Proposals for fixing GRCD violations.
 * Requires HITL approval for Tier1/Tier2 changes.
 */
export const mdmRemediationProposal = pgTable(
  'mdm_remediation_proposal',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Multi-tenant isolation
    tenantId: uuid('tenant_id').notNull(),

    // Link to violation
    violationId: uuid('violation_id')
      .notNull()
      .references(() => mdmViolationReport.id),

    // Proposed change
    targetTable: text('target_table').notNull(),
    targetId: uuid('target_id'), // May be null for INSERT proposals
    targetKey: text('target_key').notNull(),

    // What to change
    proposedChange: jsonb('proposed_change')
      .$type<Record<string, unknown>>()
      .notNull(),
    currentState: jsonb('current_state').$type<Record<string, unknown>>(),

    // Confidence & source
    confidence: text('confidence').notNull(), // high, medium, low
    proposalSource: text('proposal_source').notNull(), // auto, ai-suggested, manual

    // Workflow status
    status: text('status').notNull().default('pending'), // pending, approved, rejected, applied

    // Audit - proposal
    proposedBy: text('proposed_by').notNull(),
    proposedAt: timestamp('proposed_at', { withTimezone: true }).defaultNow(),

    // Audit - review
    reviewedBy: text('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewComment: text('review_comment'),

    // Audit - application
    appliedBy: text('applied_by'),
    appliedAt: timestamp('applied_at', { withTimezone: true }),
  },
  (table) => ({
    // One proposal per violation
    violationIdUq: uniqueIndex('mdm_remediation_proposal_violation_uq').on(
      table.violationId,
    ),

    // Index for querying by status
    tenantStatusIdx: index('mdm_remediation_proposal_status_idx').on(
      table.tenantId,
      table.status,
    ),

    // Index for querying by proposed_by
    proposedByIdx: index('mdm_remediation_proposal_proposed_by_idx').on(
      table.tenantId,
      table.proposedBy,
    ),
  }),
);

// Types
export type MDMRemediationProposalTable =
  typeof mdmRemediationProposal.$inferSelect;
export type InsertMDMRemediationProposal =
  typeof mdmRemediationProposal.$inferInsert;

// ============================================================================
// Scan History Table
// ============================================================================

/**
 * mdm_scan_history
 *
 * Records of metadata scans for audit and trending.
 */
export const mdmScanHistory = pgTable(
  'mdm_scan_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Multi-tenant isolation
    tenantId: uuid('tenant_id').notNull(),

    // Scan metadata
    scope: text('scope').notNull().default('ALL'), // ALL, or specific domain
    scanType: text('scan_type').notNull(), // full, incremental, targeted

    // Results summary
    totalEntities: text('total_entities').notNull().default('0'),
    totalFields: text('total_fields').notNull().default('0'),
    violationsFound: text('violations_found').notNull().default('0'),
    criticalCount: text('critical_count').notNull().default('0'),
    highCount: text('high_count').notNull().default('0'),
    mediumCount: text('medium_count').notNull().default('0'),
    lowCount: text('low_count').notNull().default('0'),

    // Timing
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    durationMs: text('duration_ms'),

    // Who ran it
    triggeredBy: text('triggered_by').notNull(),
    triggerSource: text('trigger_source').notNull(), // manual, scheduled, event
  },
  (table) => ({
    // Index for querying by tenant
    tenantIdx: index('mdm_scan_history_tenant_idx').on(table.tenantId),

    // Index for querying by date
    startedAtIdx: index('mdm_scan_history_started_at_idx').on(table.startedAt),
  }),
);

// Types
export type MDMScanHistoryTable = typeof mdmScanHistory.$inferSelect;
export type InsertMDMScanHistory = typeof mdmScanHistory.$inferInsert;
