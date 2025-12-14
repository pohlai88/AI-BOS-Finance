/**
 * Shared Envelope Contracts
 * 
 * Standard response envelopes for API consistency.
 * All API responses should conform to these shapes.
 */

import { z } from "zod";

// ============================================================================
// SUCCESS ENVELOPE
// ============================================================================

export const SuccessEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.literal(true),
    data: dataSchema,
    correlation_id: z.string(),
  });

// ============================================================================
// ERROR ENVELOPE
// ============================================================================

export const ErrorEnvelope = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  correlation_id: z.string(),
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const HealthResponse = z.object({
  ok: z.boolean(),
  service: z.string(),
  correlation_id: z.string(),
  version: z.string().optional(),
  uptime: z.number().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ErrorEnvelope = z.infer<typeof ErrorEnvelope>;
export type HealthResponse = z.infer<typeof HealthResponse>;

