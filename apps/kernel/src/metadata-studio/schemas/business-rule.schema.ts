import { z } from 'zod';

/**
 * Business Rule Zod Schemas
 * Validates envelope-level fields for mdm_business_rule
 * configuration is left as unknown and validated per ruleType
 */

// Governance Tier Enum
export const GovernanceTierEnum = z.enum([
  'tier1',
  'tier2',
  'tier3',
  'tier4',
  'tier5',
]);

// Governance Lane Enum
export const GovernanceLaneEnum = z.enum([
  'kernel_only',
  'governed',
  'draft',
]);

// Environment Enum
export const EnvironmentEnum = z.enum(['live', 'sandbox']);

/**
 * Base schema for mdm_business_rule rows.
 * configuration is left as unknown here and will be refined
 * per ruleType (FinanceApprovalConfigSchema, KpiDefinitionConfigSchema, etc.)
 */
export const MdmBusinessRuleBaseSchema = z.object({
  id: z.string().uuid().optional(),

  tenantId: z.string().uuid(),

  ruleType: z.string().min(1),
  key: z.string().min(1),

  name: z.string().min(1),
  description: z.string().optional(),

  tier: GovernanceTierEnum,
  lane: GovernanceLaneEnum,
  environment: EnvironmentEnum.default('live'),

  configuration: z.unknown(),

  version: z.string().min(1).default('1.0.0'),

  isActive: z.boolean().default(true),
  isDraft: z.boolean().default(false),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().min(1).optional(),
  updatedBy: z.string().min(1).optional(),
});

export type MdmBusinessRuleBase = z.infer<typeof MdmBusinessRuleBaseSchema>;

