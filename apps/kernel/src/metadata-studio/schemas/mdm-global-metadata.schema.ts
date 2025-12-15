// metadata-studio/schemas/mdm-global-metadata.schema.ts
import { z } from 'zod';
import { GovernanceTierEnum } from './business-rule.schema';

export const MetadataStatusEnum = z.enum(['active', 'deprecated', 'draft']);

/**
 * Canonical field/column-level metadata definition.
 * Mirrors mdm_global_metadata table.
 */
export const MdmGlobalMetadataSchema = z.object({
  id: z.string().uuid().optional(),

  tenantId: z.string().uuid(),

  // canonical_key: unique per tenant
  canonicalKey: z.string().min(1),

  label: z.string().min(1),
  description: z.string().optional(),

  domain: z.string().min(1),
  module: z.string().min(1),
  entityUrn: z.string().min(1),

  tier: GovernanceTierEnum,

  // required for Tier1/2 in service logic
  standardPackId: z.string().min(1).optional(),

  dataType: z.string().min(1),
  format: z.string().optional(),

  aliasesRaw: z.string().optional(),

  ownerId: z.string().min(1),
  stewardId: z.string().min(1),

  status: MetadataStatusEnum.default('active'),
  isDraft: z.boolean().default(false),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().min(1).optional(),
  updatedBy: z.string().min(1).optional(),
});

export type MdmGlobalMetadata = z.infer<typeof MdmGlobalMetadataSchema>;

