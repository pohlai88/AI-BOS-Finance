/**
 * Invoice Zod Schemas
 * 
 * Validation schemas for AP-02 Invoice Entry Cell API routes.
 * 
 * @file apps/web/src/features/invoice/schemas/invoiceZodSchemas.ts
 */

import { z } from 'zod';

// ============================================================================
// 1. INVOICE LINE SCHEMAS
// ============================================================================

/**
 * Schema for creating an invoice line
 */
export const CreateInvoiceLineSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().positive('Quantity must be positive'),
  unitPriceCents: z.number().int().nonnegative('Unit price cannot be negative'),
  debitAccountCode: z.string().min(1, 'Debit account code is required').max(50),
  creditAccountCode: z.string().max(50).optional().default('2000'),
  costCenter: z.string().max(50).optional(),
  projectCode: z.string().max(50).optional(),
});

export type CreateInvoiceLineInput = z.infer<typeof CreateInvoiceLineSchema>;

// ============================================================================
// 2. INVOICE SCHEMAS
// ============================================================================

/**
 * Schema for creating an invoice
 */
export const CreateInvoiceSchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(100),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  reference: z.string().max(100).optional(),
  vendorId: z.string().uuid('Invalid vendor ID'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  lines: z.array(CreateInvoiceLineSchema).min(1, 'At least one line is required'),
}).refine(
  (data) => data.dueDate >= data.invoiceDate,
  { message: 'Due date must be on or after invoice date', path: ['dueDate'] }
);

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;

/**
 * Schema for updating an invoice (draft only)
 */
export const UpdateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(100).optional(),
  invoiceDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  reference: z.string().max(100).optional(),
  vendorId: z.string().uuid().optional(),
  currency: z.string().length(3).optional(),
  lines: z.array(CreateInvoiceLineSchema).min(1).optional(),
});

export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;

/**
 * Schema for submitting an invoice
 */
export const SubmitInvoiceSchema = z.object({
  version: z.number().int().positive('Version is required'),
});

export type SubmitInvoiceInput = z.infer<typeof SubmitInvoiceSchema>;

/**
 * Schema for voiding an invoice
 */
export const VoidInvoiceSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
  version: z.number().int().positive('Version is required'),
});

export type VoidInvoiceInput = z.infer<typeof VoidInvoiceSchema>;

/**
 * Schema for posting an invoice to GL
 */
export const PostInvoiceSchema = z.object({
  version: z.number().int().positive('Version is required'),
});

export type PostInvoiceInput = z.infer<typeof PostInvoiceSchema>;

// ============================================================================
// 3. QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing invoices
 */
export const ListInvoicesQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  status: z.enum([
    'draft', 'submitted', 'matched', 'approved', 'posted', 'paid', 'closed', 'voided'
  ]).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  duplicateFlag: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListInvoicesQuery = z.infer<typeof ListInvoicesQuerySchema>;

// ============================================================================
// 4. DUPLICATE CHECK SCHEMA
// ============================================================================

/**
 * Schema for duplicate check request
 */
export const DuplicateCheckSchema = z.object({
  vendorId: z.string().uuid('Invalid vendor ID'),
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(100),
  invoiceDate: z.coerce.date(),
  totalAmountCents: z.number().int().positive('Amount must be positive'),
});

export type DuplicateCheckInput = z.infer<typeof DuplicateCheckSchema>;

// ============================================================================
// 5. RESPONSE SCHEMAS (for documentation)
// ============================================================================

/**
 * Invoice response schema
 */
export const InvoiceResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  invoiceNumber: z.string(),
  invoiceDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  reference: z.string().optional(),
  vendorId: z.string().uuid(),
  vendorCode: z.string().optional(),
  vendorName: z.string().optional(),
  subtotalCents: z.number(),
  taxAmountCents: z.number(),
  totalAmountCents: z.number(),
  currency: z.string(),
  status: z.enum([
    'draft', 'submitted', 'matched', 'approved', 'posted', 'paid', 'closed', 'voided'
  ]),
  matchStatus: z.enum(['passed', 'exception', 'skipped']).optional(),
  journalHeaderId: z.string().uuid().optional(),
  postedAt: z.string().datetime().optional(),
  duplicateFlag: z.boolean(),
  version: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;

/**
 * Error response schema
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
