// metadata-studio/schemas/glossary.schema.ts
import { z } from 'zod';
import { GovernanceTierEnum } from './business-rule.schema';

export const GlossaryStatusEnum = z.enum([
  'active',
  'deprecated',
  'draft',
]);

export const MdmGlossaryTermSchema = z.object({
  id: z.string().uuid().optional(),

  tenantId: z.string().uuid(),

  canonicalKey: z.string().min(1),
  term: z.string().min(1),
  description: z.string().optional(),

  domain: z.string().min(1),
  category: z.string().min(1),

  standardPackId: z.string().optional(),

  language: z.string().min(2).default('en'),

  tier: GovernanceTierEnum,
  status: GlossaryStatusEnum.default('active'),

  synonymsRaw: z.string().optional(),
  relatedCanonicalKeys: z.string().optional(),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().min(1).optional(),
  updatedBy: z.string().min(1).optional(),
});

export type MdmGlossaryTerm = z.infer<typeof MdmGlossaryTermSchema>;

