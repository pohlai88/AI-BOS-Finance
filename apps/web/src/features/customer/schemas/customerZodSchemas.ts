// ============================================================================
// SCH_CUS_ZOD_01: CUSTOMER ZOD SCHEMAS
// Enterprise-grade validation schemas for AR-01 Customer Master Cell
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
// 3. CUSTOMER STATUS (State Machine)
// ============================================================================

export const CustomerStatusSchema = z.enum([
  'draft',
  'submitted',
  'approved',
  'suspended',
  'archived',
]);

export type CustomerStatus = z.infer<typeof CustomerStatusSchema>;

// ============================================================================
// 4. CUSTOMER ACTIONS (State Machine Transitions)
// ============================================================================

export const CustomerActionSchema = z.enum([
  'submit',
  'approve',
  'reject',
  'suspend',
  'reactivate',
  'archive',
]);

export type CustomerAction = z.infer<typeof CustomerActionSchema>;

// ============================================================================
// 5. RISK LEVEL
// ============================================================================

export const RiskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export type RiskLevel = z.infer<typeof RiskLevelSchema>;

// ============================================================================
// 6. PAYMENT HISTORY FLAG
// ============================================================================

export const PaymentHistoryFlagSchema = z.enum(['GOOD', 'WARNING', 'POOR']);

export type PaymentHistoryFlag = z.infer<typeof PaymentHistoryFlagSchema>;

// ============================================================================
// 7. COLLECTION STATUS
// ============================================================================

export const CollectionStatusSchema = z.enum(['CURRENT', 'OVERDUE', 'COLLECTION']);

export type CollectionStatus = z.infer<typeof CollectionStatusSchema>;

// ============================================================================
// 8. CREATE CUSTOMER INPUT
// ============================================================================

export const CreateCustomerInputSchema = z.object({
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
  currencyPreference: CurrencyCodeSchema.optional().default('USD'),
  customerCategory: z.string()
    .max(50, 'Customer category must be at most 50 characters')
    .optional(),
  riskLevel: RiskLevelSchema.optional().default('LOW'),
  creditLimit: z.coerce.number()
    .nonnegative('Credit limit must be non-negative')
    .optional()
    .default(0),
  defaultPaymentTerms: z.number()
    .int('Payment terms must be an integer')
    .min(0, 'Payment terms must be non-negative')
    .max(365, 'Payment terms must be at most 365 days')
    .optional()
    .default(30),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerInputSchema>;

// ============================================================================
// 9. UPDATE CUSTOMER INPUT (Partial - draft only)
// ============================================================================

export const UpdateCustomerInputSchema = z.object({
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
  customerCategory: z.string()
    .max(50, 'Customer category must be at most 50 characters')
    .optional(),
  riskLevel: RiskLevelSchema.optional(),
  creditLimit: z.coerce.number()
    .nonnegative('Credit limit must be non-negative')
    .optional(),
  defaultPaymentTerms: z.number()
    .int('Payment terms must be an integer')
    .min(0, 'Payment terms must be non-negative')
    .max(365, 'Payment terms must be at most 365 days')
    .optional(),
  // Version for optimistic locking (required)
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

export type UpdateCustomerInput = z.infer<typeof UpdateCustomerInputSchema>;

// ============================================================================
// 10. VERSION INPUT (for state transitions)
// ============================================================================

export const VersionInputSchema = z.object({
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

export type VersionInput = z.infer<typeof VersionInputSchema>;

// ============================================================================
// 11. APPROVAL/REJECTION INPUT
// ============================================================================

export const ApprovalInputSchema = z.object({
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
  comments: z.string().max(1000, 'Comments must be at most 1000 characters').optional(),
});

export type ApprovalInput = z.infer<typeof ApprovalInputSchema>;

export const RejectionInputSchema = z.object({
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
  reason: z.string()
    .min(1, 'Rejection reason is required')
    .max(1000, 'Reason must be at most 1000 characters'),
});

export type RejectionInput = z.infer<typeof RejectionInputSchema>;

// ============================================================================
// 12. SUSPEND INPUT
// ============================================================================

export const SuspendInputSchema = z.object({
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
  reason: z.string()
    .min(1, 'Suspension reason is required')
    .max(1000, 'Reason must be at most 1000 characters'),
});

export type SuspendInput = z.infer<typeof SuspendInputSchema>;

// ============================================================================
// 13. CREDIT LIMIT CHANGE REQUEST INPUT
// ============================================================================

export const CreditLimitChangeRequestInputSchema = z.object({
  newCreditLimit: z.coerce.number()
    .nonnegative('Credit limit must be non-negative'),
  reason: z.string()
    .min(1, 'Change reason is required')
    .max(1000, 'Reason must be at most 1000 characters'),
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

export type CreditLimitChangeRequestInput = z.infer<typeof CreditLimitChangeRequestInputSchema>;

// ============================================================================
// 14. CREDIT LIMIT CHANGE APPROVAL INPUT
// ============================================================================

export const CreditLimitChangeApprovalInputSchema = z.object({
  changeRequestId: z.string().uuid('Invalid change request ID'),
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
  comments: z.string().max(1000, 'Comments must be at most 1000 characters').optional(),
});

export type CreditLimitChangeApprovalInput = z.infer<typeof CreditLimitChangeApprovalInputSchema>;

// ============================================================================
// 15. ADDRESS SCHEMAS
// ============================================================================

export const AddressTypeSchema = z.enum(['billing', 'shipping', 'both']);

export type AddressType = z.infer<typeof AddressTypeSchema>;

export const CreateAddressInputSchema = z.object({
  addressType: AddressTypeSchema,
  addressLine1: z.string()
    .min(1, 'Address line 1 is required')
    .max(255, 'Address line 1 must be at most 255 characters'),
  addressLine2: z.string()
    .max(255, 'Address line 2 must be at most 255 characters')
    .optional(),
  city: z.string()
    .min(1, 'City is required')
    .max(100, 'City must be at most 100 characters'),
  stateProvince: z.string()
    .max(100, 'State/Province must be at most 100 characters')
    .optional(),
  postalCode: z.string()
    .max(20, 'Postal code must be at most 20 characters')
    .optional(),
  country: CountryCodeSchema,
  isPrimary: z.boolean().optional().default(false),
});

export type CreateAddressInput = z.infer<typeof CreateAddressInputSchema>;

// ============================================================================
// 16. CONTACT SCHEMAS
// ============================================================================

export const ContactTypeSchema = z.enum(['billing', 'accounts', 'general', 'executive']);

export type ContactType = z.infer<typeof ContactTypeSchema>;

export const CreateContactInputSchema = z.object({
  contactType: ContactTypeSchema,
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters'),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be at most 255 characters')
    .optional(),
  phone: z.string()
    .max(50, 'Phone must be at most 50 characters')
    .optional(),
  title: z.string()
    .max(100, 'Title must be at most 100 characters')
    .optional(),
  isPrimary: z.boolean().optional().default(false),
  receivesInvoices: z.boolean().optional().default(false),
  receivesStatements: z.boolean().optional().default(false),
});

export type CreateContactInput = z.infer<typeof CreateContactInputSchema>;

// ============================================================================
// 17. LIST CUSTOMERS QUERY PARAMS
// ============================================================================

export const ListCustomersQuerySchema = z.object({
  status: z.union([
    CustomerStatusSchema,
    z.array(CustomerStatusSchema),
  ]).optional(),
  customerCategory: z.string().optional(),
  riskLevel: RiskLevelSchema.optional(),
  collectionStatus: CollectionStatusSchema.optional(),
  search: z.string().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type ListCustomersQuery = z.infer<typeof ListCustomersQuerySchema>;

// ============================================================================
// 18. CUSTOMER RESPONSE (from API)
// ============================================================================

export const CustomerResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  customerCode: z.string(),
  legalName: z.string(),
  displayName: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  registrationNumber: z.string().nullable().optional(),
  country: z.string(),
  currencyPreference: z.string(),
  customerCategory: z.string().nullable().optional(),
  status: CustomerStatusSchema,
  riskLevel: RiskLevelSchema.nullable().optional(),
  creditLimit: z.number(),
  currentBalance: z.number(),
  availableCredit: z.number(),
  defaultPaymentTerms: z.number().int(),
  creditRiskScore: z.number().int().nullable().optional(),
  paymentHistoryFlag: PaymentHistoryFlagSchema.nullable().optional(),
  collectionStatus: CollectionStatusSchema.nullable().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  approvedBy: z.string().uuid().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  version: z.number().int(),
  updatedAt: z.string(),
});

export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;

// ============================================================================
// 19. ADDRESS RESPONSE
// ============================================================================

export const AddressResponseSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  tenantId: z.string().uuid(),
  addressType: AddressTypeSchema,
  addressLine1: z.string(),
  addressLine2: z.string().nullable().optional(),
  city: z.string(),
  stateProvince: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string(),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int(),
});

export type AddressResponse = z.infer<typeof AddressResponseSchema>;

// ============================================================================
// 20. CONTACT RESPONSE
// ============================================================================

export const ContactResponseSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  tenantId: z.string().uuid(),
  contactType: ContactTypeSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
  receivesInvoices: z.boolean(),
  receivesStatements: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int(),
});

export type ContactResponse = z.infer<typeof ContactResponseSchema>;

// ============================================================================
// 21. CREDIT HISTORY RESPONSE
// ============================================================================

export const CreditHistoryResponseSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  tenantId: z.string().uuid(),
  oldCreditLimit: z.number().nullable().optional(),
  newCreditLimit: z.number(),
  changeReason: z.string(),
  changeRequestStatus: z.string().nullable().optional(),
  changeRequestedBy: z.string().uuid().nullable().optional(),
  changeRequestedAt: z.string().nullable().optional(),
  changeApprovedBy: z.string().uuid().nullable().optional(),
  changeApprovedAt: z.string().nullable().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  version: z.number().int(),
  updatedAt: z.string(),
});

export type CreditHistoryResponse = z.infer<typeof CreditHistoryResponseSchema>;

// ============================================================================
// 22. HELPER EXPORTS
// ============================================================================

export const customerSchemas = {
  // Input schemas
  CreateCustomerInput: CreateCustomerInputSchema,
  UpdateCustomerInput: UpdateCustomerInputSchema,
  VersionInput: VersionInputSchema,
  ApprovalInput: ApprovalInputSchema,
  RejectionInput: RejectionInputSchema,
  SuspendInput: SuspendInputSchema,
  CreditLimitChangeRequestInput: CreditLimitChangeRequestInputSchema,
  CreditLimitChangeApprovalInput: CreditLimitChangeApprovalInputSchema,
  CreateAddressInput: CreateAddressInputSchema,
  CreateContactInput: CreateContactInputSchema,
  ListCustomersQuery: ListCustomersQuerySchema,
  // Response schemas
  CustomerResponse: CustomerResponseSchema,
  AddressResponse: AddressResponseSchema,
  ContactResponse: ContactResponseSchema,
  CreditHistoryResponse: CreditHistoryResponseSchema,
} as const;
