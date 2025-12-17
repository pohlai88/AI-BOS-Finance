/**
 * TR-01 Bank Master - Type Definitions
 * 
 * @module TR-01
 */

// =============================================================================
// ENUMS
// =============================================================================

export type BankAccountType = 
  | 'checking'
  | 'savings'
  | 'payroll'
  | 'lockbox'
  | 'sweep'
  | 'imprest';

export type BankAccountStatus =
  | 'draft'
  | 'verification'
  | 'active'
  | 'suspended'
  | 'inactive'
  | 'rejected'
  | 'cancelled';

export type VerificationType =
  | 'micro_deposit'
  | 'statement_upload'
  | 'external_service'
  | 'manual';

// =============================================================================
// CORE ENTITIES
// =============================================================================

export interface BankAccount {
  id: string;
  tenantId: string;
  companyId: string;
  
  // Bank Details
  bankName: string;
  branchName?: string;
  bankAddress?: string;
  bankCountry: string;
  
  // Account Details
  accountNumber: string;         // Masked in responses
  accountNumberLast4: string;
  accountName: string;           // Legal entity name
  accountType: BankAccountType;
  currency: string;              // ISO 4217
  
  // International Identifiers
  swiftCode?: string;
  iban?: string;
  routingNumber?: string;        // US ACH/wire
  sortCode?: string;             // UK
  
  // GL Mapping
  glAccountCode: string;
  glAccountId?: string;
  
  // Status
  status: BankAccountStatus;
  
  // Verification
  verificationType?: VerificationType;
  verifiedAt?: Date;
  verifiedBy?: string;
  
  // Access Control
  authorizedUsers?: string[];
  approvalLimit?: string;        // Decimal string
  
  // Workflow
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  suspendedBy?: string;
  suspendedAt?: Date;
  suspensionReason?: string;
  
  // Audit
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  version: number;
}

export interface BankAccountSignatory {
  id: string;
  bankAccountId: string;
  userId: string;
  userName: string;
  signatureType: 'sole' | 'joint';
  approvalLimit?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdAt: Date;
}

// =============================================================================
// INPUTS
// =============================================================================

export interface CreateBankAccountInput {
  companyId: string;
  bankName: string;
  branchName?: string;
  bankAddress?: string;
  bankCountry: string;
  accountNumber: string;
  accountName: string;
  accountType: BankAccountType;
  currency: string;
  swiftCode?: string;
  iban?: string;
  routingNumber?: string;
  sortCode?: string;
  glAccountCode: string;
  verificationType?: VerificationType;
}

export interface UpdateBankAccountInput {
  bankName?: string;
  branchName?: string;
  bankAddress?: string;
  accountName?: string;
  swiftCode?: string;
  iban?: string;
  routingNumber?: string;
  sortCode?: string;
  glAccountCode?: string;
}

export interface BankAccountFilter {
  tenantId: string;
  companyId?: string;
  status?: BankAccountStatus | BankAccountStatus[];
  accountType?: BankAccountType | BankAccountType[];
  currency?: string;
  search?: string;
}

// =============================================================================
// PORTS
// =============================================================================

export interface ActorContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
}

export interface BankAccountRepositoryPort {
  create(data: Omit<BankAccount, 'id' | 'createdAt' | 'version'>): Promise<BankAccount>;
  findById(id: string, tenantId: string): Promise<BankAccount | null>;
  findByAccountNumber(accountNumber: string, tenantId: string): Promise<BankAccount | null>;
  findByFilter(filter: BankAccountFilter, limit: number, offset: number): Promise<{ data: BankAccount[]; total: number }>;
  update(id: string, tenantId: string, data: Partial<BankAccount>, version: number): Promise<BankAccount>;
  updateStatus(id: string, tenantId: string, status: BankAccountStatus, workflowData: Partial<BankAccount>, version: number): Promise<BankAccount>;
  getSignatories(bankAccountId: string): Promise<BankAccountSignatory[]>;
  addSignatory(signatory: Omit<BankAccountSignatory, 'id' | 'createdAt'>): Promise<BankAccountSignatory>;
  removeSignatory(signatoryId: string): Promise<void>;
}

export interface AuditPort {
  emit(event: {
    eventType: string;
    aggregateId: string;
    aggregateType: string;
    tenantId: string;
    userId: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}
