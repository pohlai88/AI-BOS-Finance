// metadata-studio/schemas/business-rule-config-dispatcher.ts
import { z } from 'zod';
import { FinanceApprovalConfigSchema } from './business-rule-finance.schema';

export const RULE_CONFIG_SCHEMAS: Record<string, z.ZodTypeAny> = {
  FINANCE_APPROVAL: FinanceApprovalConfigSchema,
  // KPI_DEFINITION: KpiDefinitionConfigSchema,
  // WORKFLOW_RULE: WorkflowRuleConfigSchema,
};

export function validateRuleConfiguration(ruleType: string, config: unknown) {
  const schema = RULE_CONFIG_SCHEMAS[ruleType];

  if (!schema) {
    throw new Error(`Unsupported ruleType: ${ruleType}`);
  }

  return schema.parse(config);
}

