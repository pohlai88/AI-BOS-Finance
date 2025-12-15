// metadata-studio/schemas/business-rule-finance.schema.ts
import { z } from 'zod';

/**
 * Configuration for FINANCE_APPROVAL ruleType.
 *
 * Example use:
 * - Auto-approval thresholds for expenses
 * - Which role needs to approve above certain amounts
 */
export const FinanceApprovalConfigSchema = z.object({
  // e.g. 2000 => any expense <= 2,000 auto-approves
  threshold_amount: z.number().min(0).max(1_000_000),

  // If true, anything above threshold requires workflow approval
  requires_approval: z.boolean(),

  // Which role must approve when requires_approval = true
  approver_role: z.enum(['CFO', 'Controller', 'Manager']),

  // Optional: restrict rule to certain GL codes
  gl_codes: z.array(z.string()).default([]),

  // Optional: additional formula, e.g. "amount * fx_rate"
  calculation_formula: z.string().optional(),
});

export type FinanceApprovalConfig = z.infer<typeof FinanceApprovalConfigSchema>;

