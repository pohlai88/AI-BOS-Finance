// metadata-studio/schemas/approval.schema.ts
import { z } from 'zod';
import { GovernanceTierEnum } from './business-rule.schema';

/**
 * Approval Status Enum
 * Tracks lifecycle of approval requests
 */
export const ApprovalStatusEnum = z.enum([
  'pending',
  'approved',
  'rejected',
  'cancelled',
]);

/**
 * Approval Entity Type Enum
 * Defines what kind of entity is being approved
 */
export const ApprovalEntityTypeEnum = z.enum([
  'BUSINESS_RULE',
  'GLOBAL_METADATA',
  'GLOSSARY',
  'KPI',
]);

/**
 * Approval Lane Enum
 * Governance lane for the approval (mirrored from GovernanceLaneEnum)
 */
export const ApprovalLaneEnum = z.enum([
  'kernel',     // Kernel-owned (Tier1)
  'governed',   // Governed by stewards (Tier2/3)
  'draft',      // Draft/experimental
]);

/**
 * Approval Request Schema
 * Represents a pending change that requires approval
 */
export const ApprovalRequestSchema = z.object({
  id: z.string().uuid(),

  tenantId: z.string().uuid(),

  entityType: ApprovalEntityTypeEnum,
  entityId: z.string().uuid().nullable(),   // may be null for "create"
  entityKey: z.string(),                    // canonicalKey

  tier: GovernanceTierEnum,                 // 'tier1'..'tier5'
  lane: ApprovalLaneEnum,

  payload: z.unknown(),                     // typed downstream
  currentState: z.unknown().nullable(),

  requiredRole: z.string().optional(),      // 'kernel_architect' | 'metadata_steward'...
  status: ApprovalStatusEnum,
  requestedBy: z.string(),
  decidedBy: z.string().optional(),
  decidedAt: z.string().datetime().optional(),
  reason: z.string().optional(),
});

export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

