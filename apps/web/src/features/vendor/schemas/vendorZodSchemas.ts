// ============================================================================
// SCH_VND_ZOD_01: VENDOR ZOD SCHEMAS
// Enterprise-grade validation schemas for AP-01 Vendor Master Cell
// ============================================================================
// PHILOSOPHY: Strict validation at BFF boundary, flexible in domain layer
// - All required fields validated
// - ISO standards enforced (country codes, currency codes)
// - Clear error messages for API consumers
// ============================================================================

import { z } from 'zod';

// ============================================================================
// 1. CURRENCY CODES (ISO 4217)
// ============================================================================

export const CurrencyCodeSchema = z.enum([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
  'HKD', 'SGD', 'SEK', 'NOK', 'DKK', 'CNY', 'INR', 'BRL',
  'MXN', 'ZAR', 'KRW', 'THB', 'MYR', 'PHP', 'IDR', 'VND',
]);

export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

// ============================================================================
// 2. COUNTRY CODES (ISO 3166-1 alpha-3)
// ============================================================================

export const CountryCodeSchema = z.string()
  .length(3, 'Country code must be exactly 3 characters (ISO 3166-1 alpha-3)')
  .toUpperCase();

export type CountryCode = z.infer<typeof CountryCodeSchema>;

// ============================================================================
// 3. VENDOR STATUS (State Machine)
// ============================================================================

export const VendorStatusSchema = z.enum([
  'draft',
  'submitted',
  'approved',
  'suspended',
  'archived',
]);

export type VendorStatus = z.infer<typeof VendorStatusSchema>;

// ============================================================================
// 4. VENDOR ACTIONS (State Machine Transitions)
// ============================================================================

export const VendorActionSchema = z.enum([
  'submit',
  'approve',
  'reject',
  'suspend',
  'reactivate',
  'archive',
]);

export type VendorAction = z.infer<typeof VendorActionSchema>;

// ============================================================================
// 5. RISK LEVEL
// ============================================================================

export const RiskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export type RiskLevel = z.infer<typeof RiskLevelSchema>;

// ============================================================================
// 6. CREATE VENDOR INPUT
// ============================================================================

export const CreateVendorInputSchema = z.object({
  legalName: z.string()
    .min(2, 'Legal name must be at least 2 characters')
    .max(255, 'Legal name must be at most 255 characters'),
  displayName: z.string()
    .min(1, 'Display name must be at least 1 character')
    .max(255, 'Display name must be at most 255 characters')
    .optional(),
  taxId: z.string()
    .min(5, 'Tax ID must be at least 5 characters')
    .max(50, 'Tax ID must be at most 50 characters')
    .optional(),
  registrationNumber: z.string()
    .max(50, 'Registration number must be at most 50 characters')
    .optional(),
  country: CountryCodeSchema,
  currencyPreference: CurrencyCodeSchema,
  vendorCategory: z.string()
    .max(50, 'Vendor category must be at most 50 characters')
    .optional(),
  riskLevel: RiskLevelSchema.optional().default('LOW'),
  defaultPaymentTerms: z.number()
    .int('Payment terms must be an integer')
    .min(0, 'Payment terms must be non-negative')
    .max(365, 'Payment terms must be at most 365 days')
    .optional()
    .default(30),
});

export type CreateVendorInput = z.infer<typeof CreateVendorInputSchema>;

// ============================================================================
// 7. UPDATE VENDOR INPUT (Partial - draft only)
// ============================================================================

export const UpdateVendorInputSchema = z.object({
  legalName: z.string()
    .min(2, 'Legal name must be at least 2 characters')
    .max(255, 'Legal name must be at most 255 characters')
    .optional(),
  displayName: z.string()
    .min(1, 'Display name must be at least 1 character')
    .max(255, 'Display name must be at most 255 characters')
    .optional(),
  taxId: z.string()
    .min(5, 'Tax ID must be at least 5 characters')
    .max(50, 'Tax ID must be at most 50 characters')
    .optional(),
  registrationNumber: z.string()
    .max(50, 'Registration number must be at most 50 characters')
    .optional(),
  country: CountryCodeSchema.optional(),
  currencyPreference: CurrencyCodeSchema.optional(),
  vendorCategory: z.string()
    .max(50, 'Vendor category must be at most 50 characters')
    .optional(),
  riskLevel: RiskLevelSchema.optional(),
  defaultPaymentTerms: z.number()
    .int('Payment terms must be an integer')
    .min(0, 'Payment terms must be non-negative')
    .max(365, 'Payment terms must be at most 365 days')
    .optional(),
  // Version for optimistic locking (required)
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

export type UpdateVendorInput = z.infer<typeof UpdateVendorInputSchema>;

// ============================================================================
// 8. VERSION INPUT (for state transitions)
// ============================================================================

export const VersionInputSchema = z.object({
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

export type VersionInput = z.infer<typeof VersionInputSchema>;

// ============================================================================
// 9. APPROVAL/REJECTION INPUT
// ============================================================================

export const ApprovalInputSchema = z.object({
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
  comment: z.string().max(1000, 'Comment must be at most 1000 characters').optional(),
});

export type ApprovalInput = z.infer<typeof ApprovalInputSchema>;

// ============================================================================
// 10. BANK ACCOUNT SCHEMAS
// ============================================================================

export const CreateBankAccountInputSchema = z.object({
  bankName: z.string()
    .min(2, 'Bank name must be at least 2 characters')
    .max(255, 'Bank name must be at most 255 characters'),
  accountNumber: z.string()
    .min(4, 'Account number must be at least 4 characters')
    .max(50, 'Account number must be at most 50 characters'),
  accountName: z.string()
    .min(2, 'Account name must be at least 2 characters')
    .max(255, 'Account name must be at most 255 characters'),
  routingNumber: z.string()
    .max(20, 'Routing number must be at most 20 characters')
    .optional(),
  swiftCode: z.string()
    .max(11, 'SWIFT code must be at most 11 characters')
    .optional(),
  iban: z.string()
    .max(34, 'IBAN must be at most 34 characters')
    .optional(),
  currency: CurrencyCodeSchema,
  isPrimary: z.boolean().optional().default(false),
});

export type CreateBankAccountInput = z.infer<typeof CreateBankAccountInputSchema>;

// ============================================================================
// 11. BANK ACCOUNT CHANGE REQUEST
// ============================================================================

export const RequestBankAccountChangeInputSchema = z.object({
  bankName: z.string()
    .min(2, 'Bank name must be at least 2 characters')
    .max(255, 'Bank name must be at most 255 characters')
    .optional(),
  accountNumber: z.string()
    .min(4, 'Account number must be at least 4 characters')
    .max(50, 'Account number must be at most 50 characters')
    .optional(),
  accountName: z.string()
    .min(2, 'Account name must be at least 2 characters')
    .max(255, 'Account name must be at most 255 characters')
    .optional(),
  routingNumber: z.string()
    .max(20, 'Routing number must be at most 20 characters')
    .optional(),
  swiftCode: z.string()
    .max(11, 'SWIFT code must be at most 11 characters')
    .optional(),
  iban: z.string()
    .max(34, 'IBAN must be at most 34 characters')
    .optional(),
  currency: CurrencyCodeSchema.optional(),
  // Version for optimistic locking
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

export type RequestBankAccountChangeInput = z.infer<typeof RequestBankAccountChangeInputSchema>;

// ============================================================================
// 12. BANK ACCOUNT CHANGE APPROVAL
// ============================================================================

export const ApproveBankAccountChangeInputSchema = z.object({
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

export type ApproveBankAccountChangeInput = z.infer<typeof ApproveBankAccountChangeInputSchema>;

// ============================================================================
// 13. LIST VENDORS QUERY PARAMS
// ============================================================================

export const ListVendorsQuerySchema = z.object({
  status: z.union([
    VendorStatusSchema,
    z.array(VendorStatusSchema),
  ]).optional(),
  vendorCategory: z.string().optional(),
  riskLevel: RiskLevelSchema.optional(),
  isBlacklisted: z.coerce.boolean().optional(),
  search: z.string().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type ListVendorsQuery = z.infer<typeof ListVendorsQuerySchema>;

// ============================================================================
// 14. VENDOR RESPONSE (from API)
// ============================================================================

export const VendorResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  vendorCode: z.string(),
  legalName: z.string(),
  displayName: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  registrationNumber: z.string().nullable().optional(),
  country: z.string(),
  currencyPreference: z.string(),
  vendorCategory: z.string().nullable().optional(),
  status: VendorStatusSchema,
  riskLevel: RiskLevelSchema.nullable().optional(),
  isBlacklisted: z.boolean(),
  defaultPaymentTerms: z.number().int(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  approvedBy: z.string().uuid().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  version: z.number().int(),
  updatedAt: z.string(),
});

export type VendorResponse = z.infer<typeof VendorResponseSchema>;

// ============================================================================
// 15. BANK ACCOUNT RESPONSE
// ============================================================================

export const BankAccountResponseSchema = z.object({
  id: z.string().uuid(),
  vendorId: z.string().uuid(),
  tenantId: z.string().uuid(),
  bankName: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
  routingNumber: z.string().nullable().optional(),
  swiftCode: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  currency: z.string(),
  isPrimary: z.boolean(),
  status: z.string(),
  changeRequestStatus: z.string().nullable().optional(),
  changeRequestedBy: z.string().uuid().nullable().optional(),
  changeApprovedBy: z.string().uuid().nullable().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  version: z.number().int(),
  updatedAt: z.string(),
});

export type BankAccountResponse = z.infer<typeof BankAccountResponseSchema>;

// ============================================================================
// 16. HELPER EXPORTS
// ============================================================================

export const vendorSchemas = {
  CreateVendorInput: CreateVendorInputSchema,
  UpdateVendorInput: UpdateVendorInputSchema,
  VersionInput: VersionInputSchema,
  ApprovalInput: ApprovalInputSchema,
  CreateBankAccountInput: CreateBankAccountInputSchema,
  RequestBankAccountChangeInput: RequestBankAccountChangeInputSchema,
  ApproveBankAccountChangeInput: ApproveBankAccountChangeInputSchema,
  ListVendorsQuery: ListVendorsQuerySchema,
  VendorResponse: VendorResponseSchema,
  BankAccountResponse: BankAccountResponseSchema,
} as const;
