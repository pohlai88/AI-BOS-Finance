/**
 * Canvas API Validation Schemas
 * 
 * Shared Zod schemas for canvas API routes.
 * Centralizes validation logic and error messages.
 */

import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const UUIDSchema = z.string().uuid('Must be a valid UUID');

export const URNSchema = z.string()
  .regex(
    /^urn:aibos:ap:(0[1-5]):(vendor|invoice|match|approval|payment):[a-f0-9-]{36}$/i,
    'Must be a valid AP URN (e.g., urn:aibos:ap:02:invoice:uuid)'
  );

export const LayerTypeSchema = z.enum(['data', 'team', 'personal']);

export const EditableLayerTypeSchema = z.enum(['team', 'personal'], {
  errorMap: () => ({ message: 'Data layer cannot be edited directly' }),
});

export const ObjectTypeSchema = z.enum(['hydrated_sticky', 'plain_sticky', 'annotation']);

export const ZoneTypeSchema = z.enum([
  'inbox', 'in_progress', 'review', 'done', 'blocked', 'custom'
]);

// ============================================================================
// CANVAS OBJECT SCHEMAS
// ============================================================================

export const DisplayDataSchema = z.object({
  entityType: z.string().optional(),
  cellCode: z.string().optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  content: z.string().max(2000).optional(),
  status: z.string().optional(),
  statusColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  amount: z.string().optional(),
  currency: z.string().length(3).optional(),
}).passthrough();

export const StyleSchema = z.object({
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderWidth: z.number().min(0).max(10).optional(),
  shadow: z.enum(['none', 'sm', 'md', 'lg']).optional(),
  pulse: z.boolean().optional(),
  opacity: z.number().min(0).max(1).optional(),
}).strict();

export const TagSchema = z.string()
  .min(1)
  .max(50)
  .regex(/^#?[\w-]+$/, 'Tags must be alphanumeric with optional # prefix');

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

export const ListObjectsQuerySchema = z.object({
  layerType: LayerTypeSchema.optional(),
  zoneId: UUIDSchema.optional(),
  objectType: ObjectTypeSchema.optional(),
  tags: z.string().transform(s => s.split(',')).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const CreateObjectSchema = z.object({
  objectType: ObjectTypeSchema,
  layerType: EditableLayerTypeSchema,
  sourceRef: URNSchema.optional(),
  positionX: z.number().min(-10000).max(10000),
  positionY: z.number().min(-10000).max(10000),
  width: z.number().min(50).max(1000).default(280),
  height: z.number().min(50).max(1000).default(180),
  displayData: DisplayDataSchema,
  style: StyleSchema.optional(),
  tags: z.array(TagSchema).max(20).default([]),
  zoneId: UUIDSchema.nullable().optional(),
});

export const UpdateObjectSchema = z.object({
  positionX: z.number().min(-10000).max(10000).optional(),
  positionY: z.number().min(-10000).max(10000).optional(),
  width: z.number().min(50).max(1000).optional(),
  height: z.number().min(50).max(1000).optional(),
  displayData: DisplayDataSchema.partial().optional(),
  style: StyleSchema.partial().optional(),
  tags: z.array(TagSchema).max(20).optional(),
  version: z.number().int().positive('Version is required for updates'),
});

export const MoveObjectSchema = z.object({
  zoneId: UUIDSchema.nullable().optional(),
  positionX: z.number().min(-10000).max(10000).optional(),
  positionY: z.number().min(-10000).max(10000).optional(),
  expectedVersion: z.number().int().positive('Expected version is required'),
  reason: z.string().max(500).optional(),
});

export const ReactionSchema = z.object({
  emoji: z.string()
    .min(1)
    .max(10)
    .regex(/^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|🚩|👀|✅|❌|⚠️|🔥|💰|📌$/u, 
      'Must be a valid emoji'),
});

export const AcknowledgeSchema = z.object({
  objectIds: z.array(UUIDSchema).min(1).max(50),
  comment: z.string().max(500).optional(),
  isBatchAcknowledgment: z.boolean().default(false),
});

// ============================================================================
// ZONE SCHEMAS
// ============================================================================

export const CreateZoneSchema = z.object({
  name: z.string().min(1).max(100),
  zoneType: ZoneTypeSchema,
  positionX: z.number().min(-10000).max(10000),
  positionY: z.number().min(-10000).max(10000),
  width: z.number().min(100).max(2000).default(300),
  height: z.number().min(100).max(2000).default(800),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  triggerAction: z.enum(['none', 'status_update', 'notify', 'archive', 'escalate']).default('none'),
  triggerConfig: z.record(z.unknown()).optional(),
  allowedRoles: z.array(z.string()).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export type ValidationError = z.ZodError;

export function formatValidationError(error: z.ZodError) {
  return {
    error: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    details: error.flatten(),
  };
}
