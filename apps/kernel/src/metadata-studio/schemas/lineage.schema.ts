// metadata-studio/schemas/lineage.schema.ts
import { z } from 'zod';

export const LineageRelationshipEnum = z.enum([
  'direct',
  'derived',
  'aggregated',
  'lookup',
  'manual',
]);

export const MdmLineageFieldSchema = z.object({
  id: z.string().uuid().optional(),

  tenantId: z.string().uuid(),

  sourceMetadataId: z.string().uuid(),
  targetMetadataId: z.string().uuid(),

  relationshipType: LineageRelationshipEnum,
  transformationType: z.string().optional(),
  transformationExpression: z.string().optional(),

  isPrimaryPath: z.boolean().default(true),
  confidenceScore: z.number().min(0).max(100).default(100),

  verified: z.boolean().default(false),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().datetime().optional(),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().min(1).optional(),
  updatedBy: z.string().min(1).optional(),
});

export type MdmLineageField = z.infer<typeof MdmLineageFieldSchema>;

