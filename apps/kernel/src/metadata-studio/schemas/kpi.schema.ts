// metadata-studio/schemas/kpi.schema.ts
import { z } from 'zod';
import { GovernanceTierEnum } from './business-rule.schema';

export const KpiStatusEnum = z.enum([
  'active',
  'deprecated',
  'draft',
]);

export const KpiRoleEnum = z.enum([
  'MEASURE',
  'DIMENSION',
  'FILTER',
  'DRIVER',
  'THRESHOLD',
  'OTHER',
]);

/**
 * KPI definition (API-level view).
 * We use primaryMetadataCanonicalKey instead of id;
 * service resolves it to primaryMetadataId for DB.
 */
export const MdmKpiDefinitionSchema = z.object({
  id: z.string().uuid().optional(),

  tenantId: z.string().uuid(),

  canonicalKey: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),

  domain: z.string().min(1),
  category: z.string().min(1),

  standardPackId: z.string().optional(),

  tier: GovernanceTierEnum,
  status: KpiStatusEnum.default('active'),

  expression: z.string().min(1),
  expressionLanguage: z.string().min(1).default('METADATA_DSL'),

  primaryMetadataCanonicalKey: z.string().min(1),
  aggregationLevel: z.string().optional(),

  ownerId: z.string().min(1),
  stewardId: z.string().min(1),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().min(1).optional(),
  updatedBy: z.string().min(1).optional(),
});

export type MdmKpiDefinition = z.infer<typeof MdmKpiDefinitionSchema>;

/**
 * Component input uses metadata canonical keys (not ids).
 */
export const MdmKpiComponentInputSchema = z.object({
  role: KpiRoleEnum,
  metadataCanonicalKey: z.string().min(1),
  componentExpression: z.string().optional(),
  sequence: z.number().int().min(0).default(0),
  isRequired: z.boolean().default(true),
});

export type MdmKpiComponentInput = z.infer<
  typeof MdmKpiComponentInputSchema
>;

/**
 * KPI payload used in API + approvals:
 * - one definition
 * - zero or more components
 */
export const MdmKpiDefinitionWithComponentsSchema = z.object({
  definition: MdmKpiDefinitionSchema,
  components: z.array(MdmKpiComponentInputSchema).default([]),
});

export type MdmKpiDefinitionWithComponents = z.infer<
  typeof MdmKpiDefinitionWithComponentsSchema
>;

