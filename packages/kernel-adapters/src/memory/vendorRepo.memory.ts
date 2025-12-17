/**
 * Vendor Repository Adapter - In-Memory Implementation
 * 
 * Mock implementation for development and testing.
 * Simulates database behavior including optimistic locking.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  VendorRepositoryPort,
  Vendor,
  VendorBankAccount,
  CreateVendorInput,
  UpdateVendorInput,
  UpdateVendorStatusInput,
  CreateBankAccountInput,
  RequestBankAccountChangeInput,
  ApproveBankAccountChangeInput,
  VendorQueryFilters,
  TransactionContext,
} from '@aibos/kernel-core';

// ============================================================================
// 1. IN-MEMORY STORES
// ============================================================================

const vendors = new Map<string, Vendor>();
const bankAccounts = new Map<string, VendorBankAccount>();

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function cloneVendor(vendor: Vendor): Vendor {
  return {
    ...vendor,
    createdAt: new Date(vendor.createdAt),
    approvedAt: vendor.approvedAt ? new Date(vendor.approvedAt) : undefined,
    updatedAt: new Date(vendor.updatedAt),
  };
}

function cloneBankAccount(bankAccount: VendorBankAccount): VendorBankAccount {
  return {
    ...bankAccount,
    changeRequestedAt: bankAccount.changeRequestedAt ? new Date(bankAccount.changeRequestedAt) : undefined,
    changeApprovedAt: bankAccount.changeApprovedAt ? new Date(bankAccount.changeApprovedAt) : undefined,
    createdAt: new Date(bankAccount.createdAt),
    updatedAt: new Date(bankAccount.updatedAt),
  };
}

// ============================================================================
// 3. ADAPTER IMPLEMENTATION
// ============================================================================

export function createMemoryVendorRepository(): VendorRepositoryPort {
  return {
    async withTransaction<T>(
      callback: (txContext: TransactionContext) => Promise<T>
    ): Promise<T> {
      // In-memory: simulate transaction with correlation ID
      const txContext: TransactionContext = {
        tx: null, // No real transaction
        correlationId: uuidv4(),
      };

      // Execute callback (no rollback in memory implementation)
      return callback(txContext);
    },

    async create(
      input: CreateVendorInput,
      _txContext: TransactionContext
    ): Promise<Vendor> {
      const id = uuidv4();
      const now = new Date();

      const vendor: Vendor = {
        id,
        tenantId: input.tenantId,
        vendorCode: input.vendorCode,
        legalName: input.legalName,
        displayName: input.displayName,
        taxId: input.taxId,
        registrationNumber: input.registrationNumber,
        country: input.country,
        currencyPreference: input.currencyPreference,
        vendorCategory: input.vendorCategory,
        riskLevel: input.riskLevel || 'LOW',
        status: 'draft',
        defaultPaymentTerms: input.defaultPaymentTerms || 30,
        isBlacklisted: false,
        duplicateBankAccountFlag: false,
        highRiskCategoryFlag: false,
        createdBy: input.createdBy,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };

      vendors.set(id, vendor);
      return cloneVendor(vendor);
    },

    async findById(id: string, tenantId: string): Promise<Vendor | null> {
      const vendor = vendors.get(id);
      if (!vendor || vendor.tenantId !== tenantId) {
        return null;
      }
      return cloneVendor(vendor);
    },

    async findByIdForUpdate(
      id: string,
      tenantId: string,
      _txContext: TransactionContext
    ): Promise<Vendor | null> {
      // In memory, same as findById (no row locking)
      const vendor = vendors.get(id);
      if (!vendor || vendor.tenantId !== tenantId) {
        return null;
      }
      return cloneVendor(vendor);
    },

    async findByCode(vendorCode: string, tenantId: string): Promise<Vendor | null> {
      for (const vendor of vendors.values()) {
        if (vendor.vendorCode === vendorCode && vendor.tenantId === tenantId) {
          return cloneVendor(vendor);
        }
      }
      return null;
    },

    async update(
      id: string,
      input: UpdateVendorInput,
      _txContext: TransactionContext
    ): Promise<Vendor> {
      const vendor = vendors.get(id);
      if (!vendor || vendor.tenantId !== input.tenantId) {
        throw new Error(`Vendor not found: ${id}`);
      }

      if (vendor.status !== 'draft') {
        throw new Error(`Vendor not in draft status: ${vendor.status}`);
      }

      // Update fields
      if (input.legalName !== undefined) vendor.legalName = input.legalName;
      if (input.displayName !== undefined) vendor.displayName = input.displayName;
      if (input.taxId !== undefined) vendor.taxId = input.taxId;
      if (input.registrationNumber !== undefined) vendor.registrationNumber = input.registrationNumber;
      if (input.country !== undefined) vendor.country = input.country;
      if (input.currencyPreference !== undefined) vendor.currencyPreference = input.currencyPreference;
      if (input.vendorCategory !== undefined) vendor.vendorCategory = input.vendorCategory;
      if (input.riskLevel !== undefined) vendor.riskLevel = input.riskLevel;
      if (input.defaultPaymentTerms !== undefined) vendor.defaultPaymentTerms = input.defaultPaymentTerms;

      vendor.version += 1;
      vendor.updatedAt = new Date();

      vendors.set(id, vendor);
      return cloneVendor(vendor);
    },

    async updateStatus(
      id: string,
      input: UpdateVendorStatusInput,
      _txContext: TransactionContext
    ): Promise<Vendor> {
      const vendor = vendors.get(id);
      if (!vendor || vendor.tenantId !== input.tenantId) {
        throw new Error(`Vendor not found: ${id}`);
      }

      vendor.status = input.status;
      vendor.version += 1;
      vendor.updatedAt = new Date();

      if (input.approvedBy !== undefined) vendor.approvedBy = input.approvedBy;
      if (input.approvedAt !== undefined) vendor.approvedAt = input.approvedAt;

      vendors.set(id, vendor);
      return cloneVendor(vendor);
    },

    async list(filters: VendorQueryFilters): Promise<{ vendors: Vendor[]; total: number }> {
      let results: Vendor[] = [];

      for (const vendor of vendors.values()) {
        // Apply filters
        if (vendor.tenantId !== filters.tenantId) continue;

        if (filters.status) {
          const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
          if (!statuses.includes(vendor.status)) continue;
        }

        if (filters.vendorCategory && vendor.vendorCategory !== filters.vendorCategory) continue;
        if (filters.riskLevel && vendor.riskLevel !== filters.riskLevel) continue;
        if (filters.isBlacklisted !== undefined && vendor.isBlacklisted !== filters.isBlacklisted) continue;

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matches =
            vendor.legalName.toLowerCase().includes(searchLower) ||
            (vendor.displayName && vendor.displayName.toLowerCase().includes(searchLower)) ||
            vendor.vendorCode.toLowerCase().includes(searchLower);
          if (!matches) continue;
        }

        results.push(cloneVendor(vendor));
      }

      const total = results.length;

      // Sort by createdAt descending
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      results = results.slice(offset, offset + limit);

      return { vendors: results, total };
    },

    async addBankAccount(
      input: CreateBankAccountInput,
      _txContext: TransactionContext
    ): Promise<VendorBankAccount> {
      const id = uuidv4();
      const now = new Date();

      const bankAccount: VendorBankAccount = {
        id,
        vendorId: input.vendorId,
        tenantId: input.tenantId,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountName: input.accountName,
        routingNumber: input.routingNumber,
        swiftCode: input.swiftCode,
        iban: input.iban,
        currency: input.currency,
        isPrimary: input.isPrimary || false,
        isActive: true,
        createdBy: input.createdBy,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };

      bankAccounts.set(id, bankAccount);
      return cloneBankAccount(bankAccount);
    },

    async findBankAccountById(id: string, tenantId: string): Promise<VendorBankAccount | null> {
      const bankAccount = bankAccounts.get(id);
      if (!bankAccount || bankAccount.tenantId !== tenantId) {
        return null;
      }
      return cloneBankAccount(bankAccount);
    },

    async findBankAccountByIdForUpdate(
      id: string,
      tenantId: string,
      _txContext: TransactionContext
    ): Promise<VendorBankAccount | null> {
      // In memory, same as findById (no row locking)
      const bankAccount = bankAccounts.get(id);
      if (!bankAccount || bankAccount.tenantId !== tenantId) {
        return null;
      }
      return cloneBankAccount(bankAccount);
    },

    async listBankAccounts(vendorId: string, tenantId: string): Promise<VendorBankAccount[]> {
      const results: VendorBankAccount[] = [];

      for (const bankAccount of bankAccounts.values()) {
        if (bankAccount.vendorId === vendorId && bankAccount.tenantId === tenantId) {
          results.push(cloneBankAccount(bankAccount));
        }
      }

      // Sort by isPrimary DESC, then createdAt ASC
      results.sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) {
          return a.isPrimary ? -1 : 1;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      return results;
    },

    async requestBankAccountChange(
      input: RequestBankAccountChangeInput,
      _txContext: TransactionContext
    ): Promise<VendorBankAccount> {
      const bankAccount = bankAccounts.get(input.bankAccountId);
      if (!bankAccount || bankAccount.tenantId !== input.tenantId) {
        throw new Error(`Bank account not found: ${input.bankAccountId}`);
      }

      // Update fields
      if (input.bankName !== undefined) bankAccount.bankName = input.bankName;
      if (input.accountNumber !== undefined) bankAccount.accountNumber = input.accountNumber;
      if (input.accountName !== undefined) bankAccount.accountName = input.accountName;
      if (input.routingNumber !== undefined) bankAccount.routingNumber = input.routingNumber;
      if (input.swiftCode !== undefined) bankAccount.swiftCode = input.swiftCode;
      if (input.iban !== undefined) bankAccount.iban = input.iban;
      if (input.currency !== undefined) bankAccount.currency = input.currency;

      bankAccount.changeRequestStatus = 'pending_approval';
      bankAccount.changeRequestedBy = input.requestedBy;
      bankAccount.changeRequestedAt = new Date();
      bankAccount.version += 1;
      bankAccount.updatedAt = new Date();

      bankAccounts.set(input.bankAccountId, bankAccount);
      return cloneBankAccount(bankAccount);
    },

    async approveBankAccountChange(
      input: ApproveBankAccountChangeInput,
      _txContext: TransactionContext
    ): Promise<VendorBankAccount> {
      const bankAccount = bankAccounts.get(input.bankAccountId);
      if (!bankAccount || bankAccount.tenantId !== input.tenantId) {
        throw new Error(`Bank account not found: ${input.bankAccountId}`);
      }

      if (bankAccount.changeRequestStatus !== 'pending_approval') {
        throw new Error(`Bank account change request not in pending_approval status: ${bankAccount.changeRequestStatus}`);
      }

      bankAccount.changeRequestStatus = 'approved';
      bankAccount.changeApprovedBy = input.approvedBy;
      bankAccount.changeApprovedAt = input.approvedAt;
      bankAccount.version += 1;
      bankAccount.updatedAt = new Date();

      bankAccounts.set(input.bankAccountId, bankAccount);
      return cloneBankAccount(bankAccount);
    },

    async detectDuplicateBankAccounts(
      accountNumber: string,
      routingNumber: string | undefined,
      tenantId: string,
      excludeVendorId?: string
    ): Promise<string[]> {
      const duplicateVendorIds: string[] = [];

      for (const bankAccount of bankAccounts.values()) {
        if (bankAccount.tenantId !== tenantId) continue;
        if (bankAccount.accountNumber !== accountNumber) continue;
        if (routingNumber && bankAccount.routingNumber !== routingNumber) continue;
        if (excludeVendorId && bankAccount.vendorId === excludeVendorId) continue;

        if (!duplicateVendorIds.includes(bankAccount.vendorId)) {
          duplicateVendorIds.push(bankAccount.vendorId);
        }
      }

      return duplicateVendorIds;
    },
  };
}

// ============================================================================
// 4. TEST HELPERS
// ============================================================================

/**
 * Clear all vendor data (for testing)
 */
export function clearVendorData(): void {
  vendors.clear();
  bankAccounts.clear();
}

/**
 * Get vendor count (for testing)
 */
export function getVendorCount(): number {
  return vendors.size;
}

/**
 * Get raw vendor (for testing)
 */
export function getRawVendor(id: string): Vendor | undefined {
  return vendors.get(id);
}
