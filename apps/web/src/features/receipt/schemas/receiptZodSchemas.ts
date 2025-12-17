/**
 * AR-03 Receipt Processing - Zod Schemas
 * @module AR-03
 */

import { z } from 'zod';

export const ReceiptStatusSchema = z.enum(['draft', 'submitted', 'approved', 'posted', 'reversed', 'voided']);
export type ReceiptStatus = z.infer<typeof ReceiptStatusSchema>;

export const ReceiptMethodSchema = z.enum(['WIRE', 'ACH', 'CHECK', 'CARD', 'CASH', 'OTHER']);
export type ReceiptMethod = z.infer<typeof ReceiptMethodSchema>;

export const CreateReceiptInputSchema = z.object({
  customerId: z.string().uuid(),
  receiptDate: z.coerce.date(),
  receiptMethod: ReceiptMethodSchema,
  bankAccountId: z.string().uuid().optional(),
  referenceNumber: z.string().max(100).optional(),
  receiptAmount: z.coerce.number().positive('Amount must be positive'),
  notes: z.string().max(2000).optional(),
});
export type CreateReceiptInput = z.infer<typeof CreateReceiptInputSchema>;

export const UpdateReceiptInputSchema = CreateReceiptInputSchema.partial().extend({
  version: z.number().int().nonnegative(),
});
export type UpdateReceiptInput = z.infer<typeof UpdateReceiptInputSchema>;

export const VersionInputSchema = z.object({ version: z.number().int().nonnegative() });
export type VersionInput = z.infer<typeof VersionInputSchema>;

export const ApprovalInputSchema = z.object({ version: z.number().int().nonnegative(), comments: z.string().max(1000).optional() });
export type ApprovalInput = z.infer<typeof ApprovalInputSchema>;

export const PostInputSchema = z.object({ version: z.number().int().nonnegative(), idempotencyKey: z.string().uuid() });
export type PostInput = z.infer<typeof PostInputSchema>;

export const AllocationInputSchema = z.object({ invoiceId: z.string().uuid(), amount: z.coerce.number().positive() });
export type AllocationInput = z.infer<typeof AllocationInputSchema>;

export const ListReceiptsQuerySchema = z.object({
  status: z.union([ReceiptStatusSchema, z.array(ReceiptStatusSchema)]).optional(),
  customerId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
export type ListReceiptsQuery = z.infer<typeof ListReceiptsQuerySchema>;

export const ReceiptResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  receiptNumber: z.string(),
  customerId: z.string().uuid(),
  customerCode: z.string(),
  customerName: z.string(),
  receiptDate: z.string(),
  receiptMethod: ReceiptMethodSchema,
  currency: z.string(),
  receiptAmount: z.number(),
  allocatedAmount: z.number(),
  unallocatedAmount: z.number(),
  status: ReceiptStatusSchema,
  version: z.number().int(),
  createdAt: z.string(),
});
export type ReceiptResponse = z.infer<typeof ReceiptResponseSchema>;

export const receiptSchemas = {
  CreateReceiptInput: CreateReceiptInputSchema,
  UpdateReceiptInput: UpdateReceiptInputSchema,
  VersionInput: VersionInputSchema,
  ApprovalInput: ApprovalInputSchema,
  PostInput: PostInputSchema,
  AllocationInput: AllocationInputSchema,
  ListReceiptsQuery: ListReceiptsQuerySchema,
} as const;
