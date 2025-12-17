/**
 * Payment Hub Demo Schemas
 * Zod schemas for the payment-hub-demo backend API
 * 
 * @see apps/canon/finance/accounts-payable/payment-hub-demo/src/index.ts
 */

import { z } from 'zod';

// ============================================================================
// Payment Schemas
// ============================================================================

export const PaymentHubSchema = z.object({
  id: z.string().uuid().describe('Payment transaction ID'),
  status: z.enum(['PENDING', 'PROCESSED', 'FAILED']).describe('Payment status'),
  amount: z.number().positive().describe('Payment amount'),
  currency: z.string().length(3).describe('Currency code (e.g., USD)'),
  beneficiary: z.string().min(1).describe('Beneficiary name'),
  createdAt: z.string().datetime().describe('Creation timestamp'),
  tenantId: z.string().uuid().optional().describe('Tenant ID'),
  correlationId: z.string().uuid().optional().describe('Correlation ID for tracing'),
});

export const PaymentHubCreateSchema = z.object({
  amount: z.number({
    error: 'Amount must be a valid number',
  }).positive({ message: 'Amount must be greater than 0' }).describe('Payment amount'),
  currency: z.string({
    error: 'Currency is required',
  }).length(3, { message: 'Currency must be exactly 3 characters (e.g., USD)' }).describe('Currency code'),
  beneficiary: z.string({
    error: 'Beneficiary is required',
  }).min(1, { message: 'Beneficiary name is required' }).describe('Beneficiary name'),
});

export type PaymentHub = z.infer<typeof PaymentHubSchema>;
export type PaymentHubCreate = z.infer<typeof PaymentHubCreateSchema>;

// ============================================================================
// Cell Status Schemas
// ============================================================================

export const CellStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy']).describe('Cell health status');

export const CellSchema = z.object({
  status: CellStatusSchema,
  lastChecked: z.string().datetime().describe('Last health check timestamp'),
  description: z.string().optional().describe('Cell description'),
});

export const HealthCheckSchema = z.object({
  service: z.string().describe('Service name'),
  version: z.string().describe('Service version'),
  location: z.string().describe('Service location'),
  status: CellStatusSchema.describe('Overall service status'),
  cells: z.record(
    z.string(),
    z.object({
      status: CellStatusSchema,
      lastChecked: z.string().datetime(),
    })
  ).describe('Individual cell statuses'),
  timestamp: z.string().datetime().describe('Health check timestamp'),
});

export type Cell = z.infer<typeof CellSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;
export type CellStatus = z.infer<typeof CellStatusSchema>;
