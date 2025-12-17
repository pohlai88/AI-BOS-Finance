/**
 * Accounting Validation Schemas
 *
 * Zod schemas for accounting-specific validation.
 * @see FINANCE_ERP_GAP_ANALYSIS.md - Requirement #7
 */

import { z } from 'zod';

// ============================================================
// Utility Functions
// ============================================================

export function roundAmount(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function amountsEqual(a: number, b: number, tolerance: number = 0.005): boolean {
  return Math.abs(a - b) < tolerance;
}

export function sumAmounts(amounts: number[], decimals: number = 2): number {
  return roundAmount(amounts.reduce((sum, amt) => sum + amt, 0), decimals);
}

// ============================================================
// Base Schemas
// ============================================================

export const AccountCodeSchema = z.string().regex(/^[0-9]{4,10}$/, 'Account code must be 4-10 digits');
export const CurrencyCodeSchema = z.string().regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO code');
export const TaxCodeSchema = z.string().min(1, 'Tax code is required');

export const AmountSchema = z.number()
  .min(0, 'Amount cannot be negative')
  .refine((val) => Number.isFinite(val), 'Amount must be a valid number')
  .transform((val) => roundAmount(val, 2));

export const SignedAmountSchema = z.number()
  .refine((val) => Number.isFinite(val), 'Amount must be a valid number')
  .transform((val) => roundAmount(val, 2));

// ============================================================
// Journal Entry Schemas
// ============================================================

export const JournalEntryLineSchema = z.object({
  lineNo: z.number().int().positive().optional(),
  account: AccountCodeSchema,
  accountName: z.string().optional(),
  debit: AmountSchema.default(0),
  credit: AmountSchema.default(0),
  description: z.string().max(500).optional(),
  taxCode: z.string().optional(),
  costCenter: z.string().optional(),
  project: z.string().optional(),
  entity: z.string().optional(),
  reference: z.string().optional(),
}).refine(
  (data) => (data.debit > 0) !== (data.credit > 0) || (data.debit === 0 && data.credit === 0),
  { message: 'Line must have debit OR credit, not both', path: ['debit'] }
).refine(
  (data) => data.debit > 0 || data.credit > 0,
  { message: 'Line must have a debit or credit amount', path: ['debit'] }
);

export type JournalEntryLine = z.infer<typeof JournalEntryLineSchema>;

export const JournalEntrySchema = z.object({
  documentNo: z.string().optional(),
  postingDate: z.date({ message: 'Posting date is required' }),
  documentDate: z.date().optional(),
  reference: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  currency: CurrencyCodeSchema.default('USD'),
  exchangeRate: z.number().positive().default(1),
  lines: z.array(JournalEntryLineSchema).min(2, 'Journal entry must have at least 2 lines'),
  sourceType: z.enum(['manual', 'invoice', 'payment', 'receipt', 'transfer', 'adjustment', 'reversal']).optional(),
  sourceRef: z.string().optional(),
  isReversal: z.boolean().default(false),
  reversedEntryRef: z.string().optional(),
}).refine(
  (data) => {
    const totalDebits = sumAmounts(data.lines.map((l) => l.debit));
    const totalCredits = sumAmounts(data.lines.map((l) => l.credit));
    return amountsEqual(totalDebits, totalCredits);
  },
  { message: 'Debits and credits must balance', path: ['lines'] }
);

export type JournalEntry = z.infer<typeof JournalEntrySchema>;

// ============================================================
// Period Validation
// ============================================================

export interface AccountingPeriod {
  year: number;
  month: number;
  isClosed?: boolean;
  isLocked?: boolean;
  closedAt?: Date;
  closedBy?: string;
}

export const AccountingPeriodSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  isClosed: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  closedAt: z.date().optional(),
  closedBy: z.string().optional(),
});

export function createPeriodValidator(getClosedPeriods: () => AccountingPeriod[] | Promise<AccountingPeriod[]>) {
  return z.date().refine(
    async (date) => {
      const closedPeriods = await getClosedPeriods();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      return !closedPeriods.some((p) => p.year === year && p.month === month && (p.isClosed || p.isLocked));
    },
    { message: 'Posting date is in a closed period' }
  );
}

// ============================================================
// Invoice Schemas
// ============================================================

export const InvoiceLineSchema = z.object({
  lineNo: z.number().int().positive().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: SignedAmountSchema,
  amount: SignedAmountSchema,
  taxCode: TaxCodeSchema.optional(),
  taxAmount: AmountSchema.default(0),
  account: AccountCodeSchema,
  costCenter: z.string().optional(),
  project: z.string().optional(),
});

export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;

export const InvoiceSchema = z.object({
  documentNo: z.string().optional(),
  invoiceNo: z.string().min(1, 'Invoice number is required'),
  invoiceDate: z.date({ message: 'Invoice date is required' }),
  dueDate: z.date({ message: 'Due date is required' }),
  vendorId: z.string().optional(),
  customerId: z.string().optional(),
  currency: CurrencyCodeSchema.default('USD'),
  exchangeRate: z.number().positive().default(1),
  lines: z.array(InvoiceLineSchema).min(1, 'Invoice must have at least one line'),
  subtotal: SignedAmountSchema,
  taxTotal: AmountSchema,
  total: SignedAmountSchema,
  status: z.enum(['draft', 'submitted', 'approved', 'posted', 'paid', 'cancelled']).default('draft'),
}).refine(
  (data) => {
    const calculatedSubtotal = sumAmounts(data.lines.map((l) => l.amount));
    return amountsEqual(data.subtotal, calculatedSubtotal);
  },
  { message: 'Subtotal does not match sum of line amounts', path: ['subtotal'] }
).refine(
  (data) => {
    const calculatedTax = sumAmounts(data.lines.map((l) => l.taxAmount));
    return amountsEqual(data.taxTotal, calculatedTax);
  },
  { message: 'Tax total does not match sum of line taxes', path: ['taxTotal'] }
).refine(
  (data) => amountsEqual(data.total, data.subtotal + data.taxTotal),
  { message: 'Total must equal subtotal + tax', path: ['total'] }
);

export type Invoice = z.infer<typeof InvoiceSchema>;

// ============================================================
// Payment Schemas
// ============================================================

export const PaymentAllocationSchema = z.object({
  invoiceRef: z.string(),
  invoiceNo: z.string().optional(),
  allocatedAmount: AmountSchema,
  discountAmount: AmountSchema.default(0),
  writeOffAmount: AmountSchema.default(0),
});

export type PaymentAllocation = z.infer<typeof PaymentAllocationSchema>;

export const PaymentSchema = z.object({
  documentNo: z.string().optional(),
  paymentDate: z.date({ message: 'Payment date is required' }),
  paymentMethod: z.enum(['cash', 'check', 'bank_transfer', 'card', 'other']),
  vendorId: z.string().optional(),
  customerId: z.string().optional(),
  bankAccount: z.string().optional(),
  currency: CurrencyCodeSchema.default('USD'),
  exchangeRate: z.number().positive().default(1),
  amount: AmountSchema,
  reference: z.string().optional(),
  memo: z.string().optional(),
  allocations: z.array(PaymentAllocationSchema).optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'posted', 'cancelled']).default('draft'),
}).refine(
  (data) => {
    if (!data.allocations || data.allocations.length === 0) return true;
    const totalAllocated = sumAmounts(data.allocations.map((a) => a.allocatedAmount));
    return amountsEqual(data.amount, totalAllocated);
  },
  { message: 'Allocated amounts must equal payment amount', path: ['allocations'] }
);

export type Payment = z.infer<typeof PaymentSchema>;

// ============================================================
// Validation Helpers
// ============================================================

export function validateBalance(lines: JournalEntryLine[]): {
  isBalanced: boolean;
  totalDebits: number;
  totalCredits: number;
  difference: number;
} {
  const totalDebits = sumAmounts(lines.map((l) => l.debit));
  const totalCredits = sumAmounts(lines.map((l) => l.credit));
  const difference = roundAmount(totalDebits - totalCredits);
  return { isBalanced: amountsEqual(totalDebits, totalCredits), totalDebits, totalCredits, difference };
}

export function requiresTaxCode(accountCode: string): boolean {
  const firstDigit = parseInt(accountCode.charAt(0), 10);
  return firstDigit >= 4 && firstDigit <= 7;
}

export function createReversalEntry(
  original: JournalEntry,
  reversalDate: Date,
  reason: string
): Omit<JournalEntry, 'documentNo'> {
  return {
    postingDate: reversalDate,
    documentDate: reversalDate,
    reference: `Reversal of ${original.documentNo}`,
    description: `Reversal: ${reason}`,
    currency: original.currency,
    exchangeRate: original.exchangeRate,
    lines: original.lines.map((line) => ({
      ...line,
      debit: line.credit,
      credit: line.debit,
      description: `Reversal: ${line.description || ''}`,
    })),
    sourceType: 'reversal',
    sourceRef: original.documentNo,
    isReversal: true,
    reversedEntryRef: original.documentNo,
  };
}

export default {
  JournalEntrySchema,
  JournalEntryLineSchema,
  InvoiceSchema,
  PaymentSchema,
  AccountCodeSchema,
  CurrencyCodeSchema,
  TaxCodeSchema,
  AmountSchema,
  validateBalance,
  requiresTaxCode,
  createReversalEntry,
};
