/**
 * TR-05 Bank Reconciliation Repository Port
 * 
 * Interface for bank reconciliation persistence operations.
 * Adapters (in-memory, PostgreSQL, etc.) implement this.
 * 
 * @module TR-05
 */

import type {
  BankStatement,
  StatementItem,
  ReconMatch,
  ReconMatchAllocation,
  BankAccountBalanceSnapshot,
  ReconciliationFilter,
} from '../../../apps/canon/finance/dom06-treasury/cells/tr05-bank-reconciliation/types';

/**
 * Reconciliation Repository Port
 * 
 * ENTERPRISE REQUIREMENTS:
 * - Transactional integrity (statement + items + matches)
 * - Optimistic locking (version conflicts)
 * - Tenant isolation
 * - Audit trail
 */
export interface ReconciliationRepositoryPort {
  // -------------------------------------------------------------------------
  // Statement CRUD
  // -------------------------------------------------------------------------
  
  /**
   * Create a new bank statement
   */
  createStatement(data: Omit<BankStatement, 'id' | 'version'>): Promise<BankStatement>;
  
  /**
   * Find statement by ID
   */
  findStatementById(id: string, tenantId: string): Promise<BankStatement | null>;
  
  /**
   * Find statement by deduplication keys
   */
  findStatementByKeys(keys: {
    bankAccountId: string;
    statementNumber: string;
    statementDate: Date;
    openingBalance: { amount: string; currency: string };
    closingBalance: { amount: string; currency: string };
    periodStart: Date;
    periodEnd: Date;
  }): Promise<BankStatement | null>;
  
  /**
   * Update statement (with optimistic locking)
   */
  updateStatement(
    id: string,
    tenantId: string,
    data: Partial<BankStatement>,
    expectedVersion: number
  ): Promise<BankStatement>;
  
  /**
   * List statements with filtering
   */
  listStatements(
    filter: ReconciliationFilter,
    limit: number,
    offset: number
  ): Promise<{ data: BankStatement[]; total: number }>;
  
  // -------------------------------------------------------------------------
  // Statement Items
  // -------------------------------------------------------------------------
  
  /**
   * Create a statement item
   */
  createStatementItem(data: Omit<StatementItem, 'id'>): Promise<StatementItem>;
  
  /**
   * Find statement items by statement ID
   */
  findStatementItemsByStatement(statementId: string): Promise<StatementItem[]>;
  
  /**
   * Find unmatched items for a statement
   */
  findUnmatchedItems(statementId: string): Promise<StatementItem[]>;
  
  /**
   * Update statement item
   */
  updateStatementItem(id: string, data: Partial<StatementItem>): Promise<StatementItem>;
  
  // -------------------------------------------------------------------------
  // Matches
  // -------------------------------------------------------------------------
  
  /**
   * Create a match record
   */
  createMatch(data: Omit<ReconMatch, 'id' | 'matchedAt' | 'version'>): Promise<ReconMatch>;
  
  /**
   * Find matches by statement ID
   */
  findMatchesByStatement(statementId: string): Promise<ReconMatch[]>;
  
  /**
   * Find match by ID
   */
  findMatchById(id: string): Promise<ReconMatch | null>;
  
  /**
   * Update match (with optimistic locking)
   */
  updateMatch(
    id: string,
    data: Partial<ReconMatch>,
    expectedVersion: number
  ): Promise<ReconMatch>;
  
  // -------------------------------------------------------------------------
  // Match Allocations
  // -------------------------------------------------------------------------
  
  /**
   * Create a match allocation
   */
  createMatchAllocation(
    data: Omit<ReconMatchAllocation, 'id' | 'createdAt'>
  ): Promise<ReconMatchAllocation>;
  
  /**
   * Find match allocations by match ID
   */
  findMatchAllocationsByMatch(matchId: string): Promise<ReconMatchAllocation[]>;
  
  // -------------------------------------------------------------------------
  // Balance Snapshots
  // -------------------------------------------------------------------------
  
  /**
   * Create a balance snapshot
   */
  createBalanceSnapshot(
    data: Omit<BankAccountBalanceSnapshot, 'id' | 'createdAt'>
  ): Promise<BankAccountBalanceSnapshot>;
  
  /**
   * Find latest balance snapshot for a bank account
   */
  findLatestBalanceSnapshot(
    bankAccountId: string,
    tenantId: string
  ): Promise<BankAccountBalanceSnapshot | null>;
}
