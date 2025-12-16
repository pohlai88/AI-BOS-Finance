// metadata-studio/schemas/business-rule.schema.ts
// =============================================================================
// BUSINESS RULE SCHEMA
// Validation schemas for business rules and governance
// =============================================================================

import { z } from 'zod';

/**
 * Governance tier levels - used for data classification
 */
export const GovernanceTierEnum = z.enum([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'UNCLASSIFIED',
]);

export type GovernanceTier = z.infer<typeof GovernanceTierEnum>;

/**
 * Business rule types
 */
export const BusinessRuleType = z.enum([
  'validation',
  'transformation',
  'quality',
  'security',
  'compliance',
]);

/**
 * Business rule severity
 */
export const BusinessRuleSeverity = z.enum([
  'critical',
  'high',
  'medium',
  'low',
  'info',
]);

/**
 * Business rule status
 */
export const BusinessRuleStatus = z.enum([
  'active',
  'inactive',
  'draft',
  'deprecated',
]);

/**
 * Business rule schema
 */
export const BusinessRuleSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  ruleCode: z.string().min(1).max(100),
  ruleName: z.string().min(1).max(255),
  description: z.string().nullable(),
  ruleType: BusinessRuleType,
  severity: BusinessRuleSeverity,
  status: BusinessRuleStatus,
  expression: z.string(), // SQL or expression language
  errorMessage: z.string().nullable(),
  applicableFields: z.array(z.string()).nullable(),
  createdBy: z.string(),
  updatedBy: z.string().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Business rule execution result
 */
export const BusinessRuleExecutionSchema = z.object({
  ruleId: z.string().uuid(),
  passed: z.boolean(),
  message: z.string().nullable(),
  executedAt: z.date(),
  executionTimeMs: z.number(),
});

/**
 * Type exports
 */
export type BusinessRule = z.infer<typeof BusinessRuleSchema>;
export type BusinessRuleExecution = z.infer<typeof BusinessRuleExecutionSchema>;
