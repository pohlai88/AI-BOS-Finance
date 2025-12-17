/**
 * GL-01 Chart of Accounts — Dashboard Service
 * 
 * Provides dashboard metrics and insights for COA management.
 * 
 * @module GL-01
 */

import type { Account, AccountType, AccountStatus } from '@aibos/kernel-core';

// =============================================================================
// Types
// =============================================================================

export interface COADashboardMetrics {
  // Summary counts
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  pendingApproval: number;
  
  // By type
  byType: Record<AccountType, number>;
  
  // By status
  byStatus: Record<AccountStatus, number>;
  
  // Hierarchy
  summaryAccounts: number;
  postableAccounts: number;
  maxDepth: number;
  
  // Recent activity
  recentlyCreated: number;  // Last 30 days
  recentlyModified: number; // Last 30 days
  
  // Quality metrics
  unmappedAccounts: number; // Not mapped to group COA
  orphanAccounts: number;   // Parent deleted but children remain
}

export interface AccountDistribution {
  accountType: AccountType;
  count: number;
  percentage: number;
  activeCount: number;
  inactiveCount: number;
}

export interface HierarchyHealth {
  totalDepth: number;
  averageDepth: number;
  maxBranching: number;
  averageBranching: number;
  orphanAccounts: Account[];
  circularReferences: string[];
}

export interface COADashboardRepositoryPort {
  getTotalCounts(tenantId: string, companyId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    pendingApproval: number;
  }>;
  getCountsByType(tenantId: string, companyId?: string): Promise<Record<AccountType, number>>;
  getCountsByStatus(tenantId: string, companyId?: string): Promise<Record<AccountStatus, number>>;
  getHierarchyStats(tenantId: string, companyId?: string): Promise<{
    summaryAccounts: number;
    postableAccounts: number;
    maxDepth: number;
  }>;
  getRecentActivity(tenantId: string, days: number): Promise<{
    created: number;
    modified: number;
  }>;
  getUnmappedAccounts(tenantId: string, companyId?: string): Promise<number>;
  getOrphanAccounts(tenantId: string, companyId?: string): Promise<Account[]>;
}

export interface COADashboardServiceDeps {
  repository: COADashboardRepositoryPort;
}

// =============================================================================
// Dashboard Service
// =============================================================================

export class COADashboardService {
  private readonly repository: COADashboardRepositoryPort;

  constructor(deps: COADashboardServiceDeps) {
    this.repository = deps.repository;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET DASHBOARD METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  async getDashboardMetrics(
    tenantId: string,
    companyId?: string
  ): Promise<COADashboardMetrics> {
    // Fetch all data in parallel for performance
    const [
      totalCounts,
      byType,
      byStatus,
      hierarchyStats,
      recentActivity,
      unmappedAccounts,
      orphanAccounts,
    ] = await Promise.all([
      this.repository.getTotalCounts(tenantId, companyId),
      this.repository.getCountsByType(tenantId, companyId),
      this.repository.getCountsByStatus(tenantId, companyId),
      this.repository.getHierarchyStats(tenantId, companyId),
      this.repository.getRecentActivity(tenantId, 30),
      this.repository.getUnmappedAccounts(tenantId, companyId),
      this.repository.getOrphanAccounts(tenantId, companyId),
    ]);

    return {
      totalAccounts: totalCounts.total,
      activeAccounts: totalCounts.active,
      inactiveAccounts: totalCounts.inactive,
      pendingApproval: totalCounts.pendingApproval,
      byType,
      byStatus,
      summaryAccounts: hierarchyStats.summaryAccounts,
      postableAccounts: hierarchyStats.postableAccounts,
      maxDepth: hierarchyStats.maxDepth,
      recentlyCreated: recentActivity.created,
      recentlyModified: recentActivity.modified,
      unmappedAccounts,
      orphanAccounts: orphanAccounts.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET ACCOUNT DISTRIBUTION
  // ═══════════════════════════════════════════════════════════════════════════

  async getAccountDistribution(
    tenantId: string,
    companyId?: string
  ): Promise<AccountDistribution[]> {
    const [byType, byStatus, totalCounts] = await Promise.all([
      this.repository.getCountsByType(tenantId, companyId),
      this.repository.getCountsByStatus(tenantId, companyId),
      this.repository.getTotalCounts(tenantId, companyId),
    ]);

    const total = totalCounts.total;
    const accountTypes: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

    return accountTypes.map((type) => ({
      accountType: type,
      count: byType[type] || 0,
      percentage: total > 0 ? ((byType[type] || 0) / total) * 100 : 0,
      activeCount: 0, // Would need additional query
      inactiveCount: 0,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET HIERARCHY HEALTH
  // ═══════════════════════════════════════════════════════════════════════════

  async getHierarchyHealth(
    tenantId: string,
    companyId?: string
  ): Promise<HierarchyHealth> {
    const [hierarchyStats, orphanAccounts] = await Promise.all([
      this.repository.getHierarchyStats(tenantId, companyId),
      this.repository.getOrphanAccounts(tenantId, companyId),
    ]);

    return {
      totalDepth: hierarchyStats.maxDepth,
      averageDepth: Math.round(hierarchyStats.maxDepth / 2), // Simplified
      maxBranching: 0, // Would need additional calculation
      averageBranching: 0,
      orphanAccounts,
      circularReferences: [], // Would need graph traversal
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET PENDING APPROVALS
  // ═══════════════════════════════════════════════════════════════════════════

  async getPendingApprovalCount(
    tenantId: string,
    companyId?: string
  ): Promise<number> {
    const counts = await this.repository.getTotalCounts(tenantId, companyId);
    return counts.pendingApproval;
  }
}
