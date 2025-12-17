/**
 * AR-01 Customer Master - Zod Schema Exports
 */

export {
  // Enums
  CurrencyCodeSchema,
  CountryCodeSchema,
  CustomerStatusSchema,
  CustomerActionSchema,
  RiskLevelSchema,
  PaymentHistoryFlagSchema,
  CollectionStatusSchema,
  AddressTypeSchema,
  ContactTypeSchema,
  
  // Input schemas
  CreateCustomerInputSchema,
  UpdateCustomerInputSchema,
  VersionInputSchema,
  ApprovalInputSchema,
  RejectionInputSchema,
  SuspendInputSchema,
  CreditLimitChangeRequestInputSchema,
  CreditLimitChangeApprovalInputSchema,
  CreateAddressInputSchema,
  CreateContactInputSchema,
  
  // Query schemas
  ListCustomersQuerySchema,
  
  // Response schemas
  CustomerResponseSchema,
  AddressResponseSchema,
  ContactResponseSchema,
  CreditHistoryResponseSchema,
  
  // Helper export
  customerSchemas,
  
  // Types
  type CurrencyCode,
  type CountryCode,
  type CustomerStatus,
  type CustomerAction,
  type RiskLevel,
  type PaymentHistoryFlag,
  type CollectionStatus,
  type AddressType,
  type ContactType,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type VersionInput,
  type ApprovalInput,
  type RejectionInput,
  type SuspendInput,
  type CreditLimitChangeRequestInput,
  type CreditLimitChangeApprovalInput,
  type CreateAddressInput,
  type CreateContactInput,
  type ListCustomersQuery,
  type CustomerResponse,
  type AddressResponse,
  type ContactResponse,
  type CreditHistoryResponse,
} from './customerZodSchemas';
