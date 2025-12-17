/**
 * AR-02 Sales Invoice - Zod Schemas
 * @module AR-02
 */

import { z } from 'zod';

// Enums
export const InvoiceStatusSchema = z.enum(['draft', 'submitted', 'approved', 'posted', 'paid', 'closed', 'voided']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const PaymentTermsSchema = z.enum(['NET_30', 'NET_60', 'NET_90', '2_10_NET_30', 'DUE_ON_RECEIPT', 'CUSTOM']);
export type PaymentTerms = z.infer<typeof PaymentTermsSchema>;

export const DiscountTypeSchema = z.enum(['percentage', 'fixed']);
export type DiscountType = z.infer<typeof DiscountTypeSchema>;

// Create Invoice Input
export const CreateInvoiceInputSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: z.string().length(3).optional().default('USD'),
  paymentTerms: PaymentTermsSchema.optional().default('NET_30'),
  discountType: DiscountTypeSchema.optional(),
  discountValue: z.coerce.number().nonnegative().optional().default(0),
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
});
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceInputSchema>;

// Update Invoice Input
export const UpdateInvoiceInputSchema = CreateInvoiceInputSchema.partial().extend({
  version: z.number().int().nonnegative(),
});
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceInputSchema>;

// Create Invoice Line Input
export const CreateInvoiceLineInputSchema = z.object({
  description: z.string().min(1).max(500),
  productCode: z.string().max(50).optional(),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().nonnegative('Unit price must be non-negative'),
  discountType: DiscountTypeSchema.optional(),
  discountValue: z.coerce.number().nonnegative().optional().default(0),
  taxRate: z.coerce.number().min(0).max(100),
  revenueAccountId: z.string().uuid('Invalid revenue account ID'),
  taxAccountId: z.string().uuid('Invalid tax account ID').optional(),
});
export type CreateInvoiceLineInput = z.infer<typeof CreateInvoiceLineInputSchema>;

// Version Input
export const VersionInputSchema = z.object({
  version: z.number().int().nonnegative(),
});
export type VersionInput = z.infer<typeof VersionInputSchema>;

// Approval Input
export const ApprovalInputSchema = z.object({
  version: z.number().int().nonnegative(),
  comments: z.string().max(1000).optional(),
});
export type ApprovalInput = z.infer<typeof ApprovalInputSchema>;

// Rejection Input
export const RejectionInputSchema = z.object({
  version: z.number().int().nonnegative(),
  reason: z.string().min(1).max(1000),
});
export type RejectionInput = z.infer<typeof RejectionInputSchema>;

// Post Input (with idempotency key)
export const PostInputSchema = z.object({
  version: z.number().int().nonnegative(),
  idempotencyKey: z.string().uuid('Invalid idempotency key'),
});
export type PostInput = z.infer<typeof PostInputSchema>;

// Void Input
export const VoidInputSchema = z.object({
  version: z.number().int().nonnegative(),
  reason: z.string().min(1).max(1000),
});
export type VoidInput = z.infer<typeof VoidInputSchema>;

// List Query
export const ListInvoicesQuerySchema = z.object({
  status: z.union([InvoiceStatusSchema, z.array(InvoiceStatusSchema)]).optional(),
  customerId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
export type ListInvoicesQuery = z.infer<typeof ListInvoicesQuerySchema>;

// Duplicate Check Input
export const DuplicateCheckInputSchema = z.object({
  customerId: z.string().uuid(),
  invoiceDate: z.coerce.date(),
  totalAmount: z.coerce.number().nonnegative(),
});
export type DuplicateCheckInput = z.infer<typeof DuplicateCheckInputSchema>;

// Response Schemas
export const InvoiceResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerId: z.string().uuid(),
  customerCode: z.string(),
  customerName: z.string(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  currency: z.string(),
  subtotal: z.number(),
  discountAmount: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  outstandingAmount: z.number(),
  status: InvoiceStatusSchema,
  version: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;

export const InvoiceLineResponseSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  lineNumber: z.number().int(),
  description: z.string(),
  productCode: z.string().nullable().optional(),
  quantity: z.number(),
  unitPrice: z.number(),
  discountAmount: z.number(),
  taxRate: z.number(),
  taxAmount: z.number(),
  lineTotal: z.number(),
  version: z.number().int(),
});
export type InvoiceLineResponse = z.infer<typeof InvoiceLineResponseSchema>;

// Helper export
export const invoiceSchemas = {
  CreateInvoiceInput: CreateInvoiceInputSchema,
  UpdateInvoiceInput: UpdateInvoiceInputSchema,
  CreateInvoiceLineInput: CreateInvoiceLineInputSchema,
  VersionInput: VersionInputSchema,
  ApprovalInput: ApprovalInputSchema,
  RejectionInput: RejectionInputSchema,
  PostInput: PostInputSchema,
  VoidInput: VoidInputSchema,
  ListInvoicesQuery: ListInvoicesQuerySchema,
  DuplicateCheckInput: DuplicateCheckInputSchema,
} as const;
