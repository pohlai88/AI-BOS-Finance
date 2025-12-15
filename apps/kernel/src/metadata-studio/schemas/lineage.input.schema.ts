// metadata-studio/schemas/lineage.input.schema.ts
import { z } from 'zod';
import { LineageRelationshipEnum } from './lineage.schema';

/**
 * Input for declaring a single field-level lineage edge
 * using canonical keys instead of metadata IDs.
 *
 * The service resolves canonicalKey → mdm_global_metadata.id
 */
export const LineageFieldCreateInputSchema = z.object({
  tenantId: z.string().uuid().optional(), // will be filled from auth if missing

  // canonical keys for source & target fields
  sourceCanonicalKey: z.string().min(1),
  targetCanonicalKey: z.string().min(1),

  // relationship semantics
  relationshipType: LineageRelationshipEnum,
  transformationType: z.string().optional(),
  transformationExpression: z.string().optional(),

  isPrimaryPath: z.boolean().default(true),
  confidenceScore: z.number().min(0).max(100).default(100),

  verified: z.boolean().default(false),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().datetime().optional(),

  createdBy: z.string().min(1).optional(),
  updatedBy: z.string().min(1).optional(),
});

export type LineageFieldCreateInput = z.infer<
  typeof LineageFieldCreateInputSchema
>;

