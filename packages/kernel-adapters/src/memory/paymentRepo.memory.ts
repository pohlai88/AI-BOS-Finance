/**
 * Payment Repository Adapter - In-Memory Implementation
 * 
 * Mock implementation for development and testing.
 * Simulates database behavior including optimistic locking and idempotency.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  PaymentRepositoryPort,
  Payment,
  PaymentApproval,
  CreatePaymentInput,
  UpdatePaymentStatusInput,
  RecordApprovalInput,
  PaymentQueryFilters,
  TransactionContext,
  StatusAggregate,
  CompanyAggregate,
  CashPositionEntry,
  DashboardFilters,
  PaymentStatus,
} from '@aibos/kernel-core';

// ============================================================================
// 1. IN-MEMORY STORES
// ============================================================================

const payments = new Map<string, Payment>();
const approvals = new Map<string, PaymentApproval>();
const paymentNumbers = new Map<string, number>(); // tenant -> sequence

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function generatePaymentNumber(tenantId: string): string {
  const current = paymentNumbers.get(tenantId) || 0;
  const next = current + 1;
  paymentNumbers.set(tenantId, next);
  return `PAY-${new Date().getFullYear()}-${String(next).padStart(5, '0')}`;
}

function clonePayment(payment: Payment): Payment {
  return {
    ...payment,
    paymentDate: new Date(payment.paymentDate),
    dueDate: payment.dueDate ? new Date(payment.dueDate) : undefined,
    approvedAt: payment.approvedAt ? new Date(payment.approvedAt) : undefined,
    executedAt: payment.executedAt ? new Date(payment.executedAt) : undefined,
    beneficiarySnapshotAt: payment.beneficiarySnapshotAt
      ? new Date(payment.beneficiarySnapshotAt)
      : undefined,
    createdAt: new Date(payment.createdAt),
    updatedAt: new Date(payment.updatedAt),
  };
}

// ============================================================================
// 3. ADAPTER IMPLEMENTATION
// ============================================================================

export function createMemoryPaymentRepository(): PaymentRepositoryPort {
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
      input: CreatePaymentInput,
      _txContext: TransactionContext
    ): Promise<Payment> {
      const id = uuidv4();
      const now = new Date();

      const payment: Payment = {
        id,
        tenantId: input.tenantId,
        companyId: input.companyId,
        paymentNumber: generatePaymentNumber(input.tenantId),
        vendorId: input.vendorId,
        vendorName: input.vendorName,
        amount: input.amount,
        currency: input.currency,
        paymentDate: input.paymentDate,
        dueDate: input.dueDate,
        status: 'draft',
        createdBy: input.createdBy,
        sourceDocumentId: input.sourceDocumentId,
        sourceDocumentType: input.sourceDocumentType,
        version: 1,
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
        updatedAt: now,
      };

      payments.set(id, payment);
      return clonePayment(payment);
    },

    async findById(id: string, tenantId: string): Promise<Payment | null> {
      const payment = payments.get(id);
      if (!payment || payment.tenantId !== tenantId) {
        return null;
      }
      return clonePayment(payment);
    },

    async findByIdForUpdate(
      id: string,
      tenantId: string,
      _txContext: TransactionContext
    ): Promise<Payment | null> {
      // In memory, same as findById (no row locking)
      const payment = payments.get(id);
      if (!payment || payment.tenantId !== tenantId) {
        return null;
      }
      return clonePayment(payment);
    },

    async findByIdempotencyKey(
      idempotencyKey: string,
      tenantId: string,
      _txContext: TransactionContext
    ): Promise<Payment | null> {
      for (const payment of payments.values()) {
        if (
          payment.idempotencyKey === idempotencyKey &&
          payment.tenantId === tenantId
        ) {
          return clonePayment(payment);
        }
      }
      return null;
    },

    async updateStatus(
      id: string,
      input: UpdatePaymentStatusInput,
      _txContext: TransactionContext
    ): Promise<Payment> {
      const payment = payments.get(id);
      if (!payment) {
        throw new Error(`Payment not found: ${id}`);
      }

      // Update fields
      payment.status = input.status;
      payment.version += 1;
      payment.updatedAt = new Date();

      if (input.approvedBy !== undefined) payment.approvedBy = input.approvedBy;
      if (input.approvedAt !== undefined) payment.approvedAt = input.approvedAt;
      if (input.executedBy !== undefined) payment.executedBy = input.executedBy;
      if (input.executedAt !== undefined) payment.executedAt = input.executedAt;
      if (input.journalHeaderId !== undefined) payment.journalHeaderId = input.journalHeaderId;
      if (input.beneficiaryAccountNumber !== undefined) {
        payment.beneficiaryAccountNumber = input.beneficiaryAccountNumber;
      }
      if (input.beneficiaryRoutingNumber !== undefined) {
        payment.beneficiaryRoutingNumber = input.beneficiaryRoutingNumber;
      }
      if (input.beneficiaryBankName !== undefined) {
        payment.beneficiaryBankName = input.beneficiaryBankName;
      }
      if (input.beneficiaryAccountName !== undefined) {
        payment.beneficiaryAccountName = input.beneficiaryAccountName;
      }
      if (input.beneficiarySwiftCode !== undefined) {
        payment.beneficiarySwiftCode = input.beneficiarySwiftCode;
      }
      if (input.beneficiarySnapshotAt !== undefined) {
        payment.beneficiarySnapshotAt = input.beneficiarySnapshotAt;
      }

      payments.set(id, payment);
      return clonePayment(payment);
    },

    async recordApproval(
      input: RecordApprovalInput,
      _txContext: TransactionContext
    ): Promise<PaymentApproval> {
      const id = uuidv4();
      const now = new Date();

      const approval: PaymentApproval = {
        id,
        paymentId: input.paymentId,
        tenantId: input.tenantId,
        level: input.level,
        approverId: input.approverId,
        action: input.action,
        comment: input.comment,
        decidedAt: now,
      };

      approvals.set(id, approval);
      return { ...approval };
    },

    async list(filters: PaymentQueryFilters): Promise<{
      payments: Payment[];
      total: number;
    }> {
      let results: Payment[] = [];

      for (const payment of payments.values()) {
        // Apply filters
        if (payment.tenantId !== filters.tenantId) continue;
        if (filters.companyId && payment.companyId !== filters.companyId) continue;
        if (filters.vendorId && payment.vendorId !== filters.vendorId) continue;
        if (filters.createdBy && payment.createdBy !== filters.createdBy) continue;

        if (filters.status) {
          const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
          if (!statuses.includes(payment.status)) continue;
        }

        if (filters.fromDate && payment.paymentDate < filters.fromDate) continue;
        if (filters.toDate && payment.paymentDate > filters.toDate) continue;

        results.push(clonePayment(payment));
      }

      const total = results.length;

      // Sort by createdAt descending
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      results = results.slice(offset, offset + limit);

      return { payments: results, total };
    },

    async getApprovalHistory(
      paymentId: string,
      tenantId: string
    ): Promise<PaymentApproval[]> {
      const history: PaymentApproval[] = [];

      for (const approval of approvals.values()) {
        if (approval.paymentId === paymentId && approval.tenantId === tenantId) {
          history.push({ ...approval });
        }
      }

      // Sort by decidedAt ascending
      history.sort((a, b) => a.decidedAt.getTime() - b.decidedAt.getTime());

      return history;
    },

    // ========================================================================
    // DASHBOARD QUERIES
    // ========================================================================

    async getStatusAggregates(
      filters: DashboardFilters
    ): Promise<StatusAggregate[]> {
      const aggregates = new Map<PaymentStatus, { count: number; total: number; currency: string }>();

      for (const payment of payments.values()) {
        if (payment.tenantId !== filters.tenantId) continue;
        if (filters.companyId && payment.companyId !== filters.companyId) continue;
        if (filters.fromDate && payment.paymentDate < filters.fromDate) continue;
        if (filters.toDate && payment.paymentDate > filters.toDate) continue;

        const existing = aggregates.get(payment.status) || { count: 0, total: 0, currency: payment.currency };
        existing.count += 1;
        existing.total += parseFloat(payment.amount);
        aggregates.set(payment.status, existing);
      }

      const result: StatusAggregate[] = [];
      for (const [status, data] of aggregates) {
        result.push({
          status,
          count: data.count,
          totalAmount: data.total.toFixed(2),
          currency: data.currency,
        });
      }

      return result;
    },

    async getCompanyAggregates(
      filters: DashboardFilters
    ): Promise<CompanyAggregate[]> {
      const aggregates = new Map<string, CompanyAggregate>();

      for (const payment of payments.values()) {
        if (payment.tenantId !== filters.tenantId) continue;
        if (filters.fromDate && payment.paymentDate < filters.fromDate) continue;
        if (filters.toDate && payment.paymentDate > filters.toDate) continue;

        const existing = aggregates.get(payment.companyId) || {
          companyId: payment.companyId,
          companyName: `Company ${payment.companyId.slice(0, 8)}`, // Mock name
          pendingCount: 0,
          pendingAmount: '0.00',
          completedCount: 0,
          completedAmount: '0.00',
          totalCount: 0,
          totalAmount: '0.00',
          currency: payment.currency,
        };

        const amount = parseFloat(payment.amount);
        existing.totalCount += 1;
        existing.totalAmount = (parseFloat(existing.totalAmount) + amount).toFixed(2);

        if (payment.status === 'pending_approval' || payment.status === 'approved' || payment.status === 'processing') {
          existing.pendingCount += 1;
          existing.pendingAmount = (parseFloat(existing.pendingAmount) + amount).toFixed(2);
        } else if (payment.status === 'completed') {
          existing.completedCount += 1;
          existing.completedAmount = (parseFloat(existing.completedAmount) + amount).toFixed(2);
        }

        aggregates.set(payment.companyId, existing);
      }

      return Array.from(aggregates.values());
    },

    async getCashPosition(
      filters: DashboardFilters,
      days: number = 90
    ): Promise<CashPositionEntry[]> {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + days);

      // Group payments by date
      const dailyTotals = new Map<string, { amount: number; count: number; currency: string }>();

      for (const payment of payments.values()) {
        if (payment.tenantId !== filters.tenantId) continue;
        if (filters.companyId && payment.companyId !== filters.companyId) continue;

        // Only include non-completed, non-failed, non-rejected payments
        if (['completed', 'failed', 'rejected'].includes(payment.status)) continue;

        const paymentDate = new Date(payment.paymentDate);
        paymentDate.setHours(0, 0, 0, 0);

        if (paymentDate < today || paymentDate > endDate) continue;

        const dateKey = paymentDate.toISOString().split('T')[0];
        const existing = dailyTotals.get(dateKey) || { amount: 0, count: 0, currency: payment.currency };
        existing.amount += parseFloat(payment.amount);
        existing.count += 1;
        dailyTotals.set(dateKey, existing);
      }

      // Convert to array sorted by date
      const result: CashPositionEntry[] = [];
      for (const [dateStr, data] of dailyTotals) {
        result.push({
          date: new Date(dateStr),
          scheduledAmount: data.amount.toFixed(2),
          paymentCount: data.count,
          currency: data.currency || 'USD',
        });
      }

      result.sort((a, b) => a.date.getTime() - b.date.getTime());
      return result;
    },

    async getPendingApprovalCount(
      approverId: string,
      tenantId: string
    ): Promise<number> {
      let count = 0;

      for (const payment of payments.values()) {
        if (payment.tenantId !== tenantId) continue;
        if (payment.status === 'pending_approval') {
          // In a real implementation, check if approverId is in the approval chain
          // For now, count all pending approvals
          count += 1;
        }
      }

      return count;
    },
  };
}

// ============================================================================
// 4. TEST HELPERS
// ============================================================================

/**
 * Clear all payment data (for testing)
 */
export function clearPaymentData(): void {
  payments.clear();
  approvals.clear();
  paymentNumbers.clear();
}

/**
 * Get payment count (for testing)
 */
export function getPaymentCount(): number {
  return payments.size;
}

/**
 * Get raw payment (for testing)
 */
export function getRawPayment(id: string): Payment | undefined {
  return payments.get(id);
}
