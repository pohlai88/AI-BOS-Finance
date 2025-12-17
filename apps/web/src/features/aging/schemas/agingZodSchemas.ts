/**
 * AR-05 AR Aging & Collection - Zod Schemas
 * @module AR-05
 */

import { z } from 'zod';

export const AgingBucketSchema = z.enum(['CURRENT', '1_30', '31_60', '61_90', '91_120', 'OVER_120']);
export type AgingBucket = z.infer<typeof AgingBucketSchema>;

export const CollectionStatusSchema = z.enum(['CURRENT', 'OVERDUE', 'COLLECTION', 'WRITE_OFF']);
export type CollectionStatus = z.infer<typeof CollectionStatusSchema>;

export const CollectionActionTypeSchema = z.enum(['REMINDER', 'PHONE_CALL', 'LETTER', 'ESCALATION', 'PAYMENT_PLAN', 'LEGAL', 'WRITE_OFF', 'NOTE']);
export type CollectionActionType = z.infer<typeof CollectionActionTypeSchema>;

export const GenerateSnapshotInputSchema = z.object({
  asOfDate: z.coerce.date(),
});
export type GenerateSnapshotInput = z.infer<typeof GenerateSnapshotInputSchema>;

export const CreateCollectionActionInputSchema = z.object({
  customerId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  actionType: CollectionActionTypeSchema,
  description: z.string().min(1).max(2000),
  followUpDate: z.coerce.date().optional(),
  assignedTo: z.string().uuid().optional(),
});
export type CreateCollectionActionInput = z.infer<typeof CreateCollectionActionInputSchema>;

export const UpdateCollectionActionInputSchema = z.object({
  outcome: z.string().max(2000).optional(),
  followUpDate: z.coerce.date().optional(),
  version: z.number().int().nonnegative(),
});
export type UpdateCollectionActionInput = z.infer<typeof UpdateCollectionActionInputSchema>;

export const AgingFilterSchema = z.object({
  snapshotId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  agingBucket: AgingBucketSchema.optional(),
  collectionStatus: CollectionStatusSchema.optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
export type AgingFilter = z.infer<typeof AgingFilterSchema>;

export const AgingSnapshotResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  snapshotDate: z.string(),
  generatedBy: z.string().uuid(),
  generatedAt: z.string(),
  totalOutstanding: z.number(),
  current: z.number(),
  days1to30: z.number(),
  days31to60: z.number(),
  days61to90: z.number(),
  days91to120: z.number(),
  over120Days: z.number(),
});
export type AgingSnapshotResponse = z.infer<typeof AgingSnapshotResponseSchema>;

export const CustomerAgingResponseSchema = z.object({
  id: z.string().uuid(),
  snapshotId: z.string().uuid(),
  customerId: z.string().uuid(),
  customerCode: z.string(),
  customerName: z.string(),
  totalOutstanding: z.number(),
  current: z.number(),
  days1to30: z.number(),
  days31to60: z.number(),
  days61to90: z.number(),
  days91to120: z.number(),
  over120Days: z.number(),
  oldestInvoiceDate: z.string(),
  averageDaysOverdue: z.number().int(),
  collectionStatus: CollectionStatusSchema,
});
export type CustomerAgingResponse = z.infer<typeof CustomerAgingResponseSchema>;

export const CollectionActionResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  invoiceId: z.string().uuid().nullable().optional(),
  actionType: CollectionActionTypeSchema,
  actionDate: z.string(),
  description: z.string(),
  outcome: z.string().nullable().optional(),
  followUpDate: z.string().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  version: z.number().int(),
});
export type CollectionActionResponse = z.infer<typeof CollectionActionResponseSchema>;

export const agingSchemas = {
  GenerateSnapshotInput: GenerateSnapshotInputSchema,
  CreateCollectionActionInput: CreateCollectionActionInputSchema,
  UpdateCollectionActionInput: UpdateCollectionActionInputSchema,
  AgingFilter: AgingFilterSchema,
} as const;
