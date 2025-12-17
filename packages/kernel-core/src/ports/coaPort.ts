/**
 * Chart of Accounts Port (K_COA)
 * 
 * Interface for Chart of Accounts validation and lookups.
 * Used by AP-02 (invoice posting), GL-03 (journal entries).
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 * 
 * @file packages/kernel-core/src/ports/coaPort.ts
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Account types in the Chart of Accounts
 */
export type AccountType =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'REVENUE'
  | 'EXPENSE';

/**
 * Account status
 */
export type AccountStatus = 'active' | 'inactive' | 'blocked';

/**
 * Account entity from Chart of Accounts
 */
export interface Account {
  /** Account ID */
  id: string;
  /** Tenant ID */
  tenantId: string;
  /** Company ID */
  companyId: string;
  /** Account code (e.g., 1010-00) */
  accountCode: string;
  /** Account name */
  accountName: string;
  /** Account type */
  accountType: AccountType;
  /** Parent account ID (for hierarchy) */
  parentAccountId?: string;
  /** Account level in hierarchy */
  level: number;
  /** Is this a posting account (leaf node) */
  isPostable: boolean;
  /** Account status */
  status: AccountStatus;
  /** Normal balance (DEBIT or CREDIT) */
  normalBalance: 'DEBIT' | 'CREDIT';
  /** Currency (for multi-currency accounts) */
  currency?: string;
  /** Description */
  description?: string;
  /** Created at */
  createdAt: Date;
  /** Updated at */
  updatedAt: Date;
}

/**
 * Account validation result
 */
export interface AccountValidationResult {
  /** Is the account valid for posting */
  isValid: boolean;
  /** Account (if found) */
  account?: Account;
  /** Error code if invalid */
  errorCode?: 
    | 'ACCOUNT_NOT_FOUND'
    | 'ACCOUNT_INACTIVE'
    | 'ACCOUNT_NOT_POSTABLE'
    | 'ACCOUNT_BLOCKED'
    | 'WRONG_TENANT'
    | 'WRONG_COMPANY';
  /** Error message */
  errorMessage?: string;
}

/**
 * Account search filters
 */
export interface AccountSearchFilters {
  /** Tenant ID (required) */
  tenantId: string;
  /** Company ID (optional) */
  companyId?: string;
  /** Search by code prefix */
  codePrefix?: string;
  /** Search by name (partial match) */
  nameContains?: string;
  /** Filter by type */
  accountType?: AccountType;
  /** Filter by status */
  status?: AccountStatus;
  /** Only postable accounts */
  postableOnly?: boolean;
  /** Only parent accounts (non-postable) */
  parentOnly?: boolean;
  /** Parent account ID (for hierarchy) */
  parentAccountId?: string;
}

/**
 * Account balance (for GL queries)
 */
export interface AccountBalance {
  /** Account ID */
  accountId: string;
  /** Account code */
  accountCode: string;
  /** Account name */
  accountName: string;
  /** Debit balance (in cents) */
  debitBalance: number;
  /** Credit balance (in cents) */
  creditBalance: number;
  /** Net balance (in cents, positive = debit, negative = credit) */
  netBalance: number;
  /** Currency */
  currency: string;
  /** As of date */
  asOfDate: Date;
}

// ============================================================================
// 2. PORT INTERFACE
// ============================================================================

/**
 * Chart of Accounts Port for account validation and lookups
 * 
 * ENTERPRISE REQUIREMENTS:
 * - All GL postings must use valid accounts
 * - Accounts must be active and postable
 * - Multi-company support
 * - Hierarchical account structure
 */
export interface COAPort {
  /**
   * Validate an account for posting
   * 
   * @param accountCode - Account code to validate
   * @param tenantId - Tenant ID
   * @param companyId - Company ID
   * @returns Validation result
   * 
   * Business Rules:
   * - Account must exist
   * - Account must be active
   * - Account must be postable (leaf node)
   * - Account must belong to tenant/company
   */
  validateAccount(
    accountCode: string,
    tenantId: string,
    companyId: string
  ): Promise<AccountValidationResult>;

  /**
   * Get account by code
   * 
   * @param accountCode - Account code
   * @param tenantId - Tenant ID
   * @param companyId - Company ID (optional)
   * @returns Account or null
   */
  getAccountByCode(
    accountCode: string,
    tenantId: string,
    companyId?: string
  ): Promise<Account | null>;

  /**
   * Get account by ID
   * 
   * @param accountId - Account ID
   * @param tenantId - Tenant ID
   * @returns Account or null
   */
  getAccountById(
    accountId: string,
    tenantId: string
  ): Promise<Account | null>;

  /**
   * Search accounts
   * 
   * @param filters - Search filters
   * @returns List of matching accounts
   */
  searchAccounts(filters: AccountSearchFilters): Promise<Account[]>;

  /**
   * Get account hierarchy (tree structure)
   * 
   * @param tenantId - Tenant ID
   * @param companyId - Company ID
   * @param rootAccountId - Optional root account ID
   * @returns Hierarchical list of accounts
   */
  getAccountHierarchy(
    tenantId: string,
    companyId: string,
    rootAccountId?: string
  ): Promise<Account[]>;

  /**
   * Get account balance
   * 
   * @param accountCode - Account code
   * @param tenantId - Tenant ID
   * @param companyId - Company ID
   * @param asOfDate - Balance as of date
   * @returns Account balance or null
   */
  getAccountBalance(
    accountCode: string,
    tenantId: string,
    companyId: string,
    asOfDate: Date
  ): Promise<AccountBalance | null>;

  /**
   * Validate multiple accounts in batch
   * 
   * @param accountCodes - Array of account codes
   * @param tenantId - Tenant ID
   * @param companyId - Company ID
   * @returns Map of account code to validation result
   */
  validateAccountsBatch(
    accountCodes: string[],
    tenantId: string,
    companyId: string
  ): Promise<Map<string, AccountValidationResult>>;
}

// ============================================================================
// 3. UTILITY FUNCTIONS
// ============================================================================

/**
 * Get normal balance for account type
 */
export function getNormalBalance(accountType: AccountType): 'DEBIT' | 'CREDIT' {
  switch (accountType) {
    case 'ASSET':
    case 'EXPENSE':
      return 'DEBIT';
    case 'LIABILITY':
    case 'EQUITY':
    case 'REVENUE':
      return 'CREDIT';
    default:
      return 'DEBIT';
  }
}

/**
 * Check if account code is valid format
 */
export function isValidAccountCodeFormat(accountCode: string): boolean {
  // Format: NNNN-NN or NNNN-NN-NN (with optional sub-accounts)
  return /^\d{4}(-\d{2}){1,2}$/.test(accountCode);
}
