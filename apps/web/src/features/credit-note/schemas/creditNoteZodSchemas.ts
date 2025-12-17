/**
 * AR-04 Credit Note - Zod Schemas
 * @module AR-04
 */

import { z } from 'zod';

export const CreditNoteStatusSchema = z.enum(['draft', 'submitted', 'approved', 'posted', 'applied', 'voided']);
export type CreditNoteStatus = z.infer<typeof CreditNoteStatusSchema>;

export const CreditNoteReasonSchema = z.enum(['RETURN', 'PRICING_ERROR', 'DAMAGED_GOODS', 'SERVICE_ISSUE', 'GOODWILL', 'OTHER']);
export type CreditNoteReason = z.infer<typeof CreditNoteReasonSchema>;

export const CreateCreditNoteInputSchema = z.object({
  customerId: z.string().uuid(),
  originalInvoiceId: z.string().uuid().optional(),
  creditNoteDate: z.coerce.date(),
  reason: CreditNoteReasonSchema,
  reasonDescription: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateCreditNoteInput = z.infer<typeof CreateCreditNoteInputSchema>;

export const CreateCreditNoteLineInputSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().min(0).max(100),
  revenueAccountId: z.string().uuid(),
});
export type CreateCreditNoteLineInput = z.infer<typeof CreateCreditNoteLineInputSchema>;

export const VersionInputSchema = z.object({ version: z.number().int().nonnegative() });
export type VersionInput = z.infer<typeof VersionInputSchema>;

export const ApprovalInputSchema = z.object({ version: z.number().int().nonnegative(), comments: z.string().max(1000).optional() });
export type ApprovalInput = z.infer<typeof ApprovalInputSchema>;

export const PostInputSchema = z.object({ version: z.number().int().nonnegative(), idempotencyKey: z.string().uuid() });
export type PostInput = z.infer<typeof PostInputSchema>;

export const ApplicationInputSchema = z.object({ invoiceId: z.string().uuid(), amount: z.coerce.number().positive() });
export type ApplicationInput = z.infer<typeof ApplicationInputSchema>;

export const ListCreditNotesQuerySchema = z.object({
  status: z.union([CreditNoteStatusSchema, z.array(CreditNoteStatusSchema)]).optional(),
  customerId: z.string().uuid().optional(),
  originalInvoiceId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
export type ListCreditNotesQuery = z.infer<typeof ListCreditNotesQuerySchema>;

export const CreditNoteResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  creditNoteNumber: z.string(),
  customerId: z.string().uuid(),
  customerCode: z.string(),
  customerName: z.string(),
  originalInvoiceId: z.string().uuid().nullable().optional(),
  creditNoteDate: z.string(),
  currency: z.string(),
  subtotal: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  appliedAmount: z.number(),
  unappliedAmount: z.number(),
  reason: CreditNoteReasonSchema,
  status: CreditNoteStatusSchema,
  version: z.number().int(),
  createdAt: z.string(),
});
export type CreditNoteResponse = z.infer<typeof CreditNoteResponseSchema>;

export const creditNoteSchemas = {
  CreateCreditNoteInput: CreateCreditNoteInputSchema,
  CreateCreditNoteLineInput: CreateCreditNoteLineInputSchema,
  VersionInput: VersionInputSchema,
  ApprovalInput: ApprovalInputSchema,
  PostInput: PostInputSchema,
  ApplicationInput: ApplicationInputSchema,
  ListCreditNotesQuery: ListCreditNotesQuerySchema,
} as const;
