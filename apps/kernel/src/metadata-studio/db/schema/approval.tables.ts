// metadata-studio/db/schema/approval.tables.ts
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

/**
 * mdm_approval
 *
 * Generic approval queue for governed changes:
 * - Business rule changes (BUSINESS_RULE)
 * - Metadata changes (GLOBAL_METADATA)
 * - Glossary term changes (GLOSSARY)
 * - KPI definition changes (KPI)
 *
 * The actual "change" is stored as JSON payload so we can handle
 * all entity types with one table.
 *
 * Event Integration:
 * - When status changes to 'approved', the approvals.routes.ts
 *   emits events (metadata.approved, kpi.approved, etc.)
 * - These events trigger downstream processes (profiling, impact analysis)
 */
export const mdmApproval = pgTable(
  'mdm_approval',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    tenantId: uuid('tenant_id').notNull(),

    /**
     * What is being changed:
     * - 'BUSINESS_RULE'
     * - 'GLOBAL_METADATA'
     * - 'GLOSSARY'
     * - 'KPI'
     */
    entityType: text('entity_type')
      .$type<'BUSINESS_RULE' | 'GLOBAL_METADATA' | 'GLOSSARY' | 'KPI'>()
      .notNull(),

    /**
     * ID of the entity being changed (if exists already),
     * or null for "create" operations.
     */
    entityId: uuid('entity_id'),

    /**
     * Optional stable identity, e.g.
     * - mdm_business_rule.key
     * - mdm_global_metadata.canonical_key
     */
    entityKey: text('entity_key'),

    /**
     * Governance info at time of request
     */
    tier: text('tier')
      .$type<'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5'>()
      .notNull(),
    lane: text('lane')
      .$type<'kernel' | 'governed' | 'draft'>()
      .notNull(),

    /**
     * JSON payload describing the requested change.
     * For BUSINESS_RULE: envelope + configuration.
     * For GLOBAL_METADATA: metadata envelope.
     */
    payload: jsonb('payload').notNull(),

    /**
     * JSON payload describing the "current" state (if any),
     * to show diff to approvers.
     */
    currentState: jsonb('current_state'),

    /**
     * Status of the approval request:
     * - 'pending'
     * - 'approved'
     * - 'rejected'
     * - 'cancelled'
     */
    status: text('status')
      .$type<'pending' | 'approved' | 'rejected' | 'cancelled'>()
      .notNull()
      .default('pending'),

    /**
     * Reason/notes from approver/rejector
     */
    decisionReason: text('decision_reason'),

    /**
     * Who requested the change, and who decided
     */
    requestedBy: text('requested_by').notNull(),
    decidedBy: text('decided_by'),

    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),

    /**
     * For routing / visibility:
     * e.g. 'CFO', 'Controller', 'MetadataSteward'
     * Optional: if NULL, any authenticated user can approve (subject to auth middleware)
     */
    requiredRole: text('required_role'),
  },
  (table) => ({
    tenantStatusIdx: index('mdm_approval_tenant_status_idx').on(
      table.tenantId,
      table.status,
    ),
    tenantEntityIdx: index('mdm_approval_tenant_entity_idx').on(
      table.tenantId,
      table.entityType,
      table.entityKey,
    ),
  }),
);

// Types
export type ApprovalTable = typeof mdmApproval.$inferSelect;
export type InsertApproval = typeof mdmApproval.$inferInsert;

