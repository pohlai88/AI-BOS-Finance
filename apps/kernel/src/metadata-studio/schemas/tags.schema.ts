// metadata-studio/schemas/tags.schema.ts
import { z } from 'zod';

export const TagStatusEnum = z.enum(['active', 'inactive']);

export const MdmTagSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),

  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),

  category: z.string().min(1),
  standardPackId: z.string().optional(),

  status: TagStatusEnum.default('active'),
  isSystem: z.boolean().default(false),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().min(1).optional(),
  updatedBy: z.string().min(1).optional(),
});

export type MdmTag = z.infer<typeof MdmTagSchema>;

export const TagAssignmentTargetTypeEnum = z.enum([
  'GLOBAL_METADATA',
  'GLOSSARY',
  'KPI', // planned; safe to include
]);

export const MdmTagAssignmentSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  tagId: z.string().uuid(),

  targetType: TagAssignmentTargetTypeEnum,
  targetCanonicalKey: z.string().min(1),

  createdAt: z.string().datetime().optional(),
  createdBy: z.string().min(1).optional(),
});

export type MdmTagAssignment = z.infer<typeof MdmTagAssignmentSchema>;

