/**
 * Vendor Dashboard Service
 * 
 * AP-01 Vendor Master Cell — Dashboard metrics and aggregations.
 * 
 * Responsibilities:
 * - Provide vendor health metrics
 * - Pending approvals tracking
 * - Bank account change monitoring
 * - Risk distribution analysis
 * 
 * Powers the AP-01 cell dashboard in the AP Manager.
 */

import type {
  VendorRepositoryPort,
  Vendor,
  VendorStatus,
  RiskLevel,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Vendor dashboard metrics
 */
export interface VendorDashboardMetrics {
  /** Cell identity */
  cellCode: 'AP-01';
  cellName: 'Vendor Master';
  
  /** Health score (0-100) */
  healthScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  
  /** Work queue */
  openItems: {
    total: number;
    pendingApproval: number;
    pendingBankChanges: number;
  };
  
  /** Vendor counts */
  vendorMetrics: {
    totalActiveVendors: number;
    newVendorsThisMonth: number;
    suspendedVendors: number;
    archivedVendors: number;
  };
  
  /** Risk distribution */
  byRiskLevel: {
    high: number;
    medium: number;
    low: number;
  };
  
  /** Status distribution */
  byStatus: StatusCount[];
  
  /** Bank account health */
  bankAccountHealth: {
    changesLast30Days: number;
    changesAwaitingApproval: number;
    duplicateFlagCount: number;
  };
  
  /** Control health */
  controlHealth: {
    sodComplianceRate: number;
    dualControlCompliance: number;
    auditCoverage: number;
  };
  
  generatedAt: Date;
}

interface StatusCount {
  status: VendorStatus;
  count: number;
}

/**
 * Vendor cell summary (for AP Manager)
 */
export interface VendorCellSummary {
  code: 'AP-01';
  name: 'Vendor Master';
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  openItems: number;
  keyMetric: { label: string; value: number | string };
}

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function calculateHealthScore(metrics: {
  pendingApproval: number;
  pendingBankChanges: number;
  duplicateFlagCount: number;
}): number {
  let score = 100;
  
  // Deduct for pending approvals
  if (metrics.pendingApproval > 50) score -= 20;
  else if (metrics.pendingApproval > 20) score -= 10;
  else if (metrics.pendingApproval > 10) score -= 5;
  
  // Deduct for pending bank changes (high risk)
  if (metrics.pendingBankChanges > 10) score -= 15;
  else if (metrics.pendingBankChanges > 5) score -= 10;
  else if (metrics.pendingBankChanges > 0) score -= 5;
  
  // Deduct for duplicate flags
  if (metrics.duplicateFlagCount > 5) score -= 15;
  else if (metrics.duplicateFlagCount > 0) score -= 5;
  
  return Math.max(score, 0);
}

function determineHealthStatus(score: number): 'healthy' | 'warning' | 'critical' {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}

// ============================================================================
// 3. SERVICE
// ============================================================================

/**
 * VendorDashboardService — Powers the AP-01 cell dashboard
 */
export class VendorDashboardService {
  constructor(
    private vendorRepo: VendorRepositoryPort
  ) {}

  /**
   * Get full dashboard metrics for AP-01
   */
  async getDashboard(actor: ActorContext): Promise<VendorDashboardMetrics> {
    const tenantId = actor.tenantId;
    
    // Get all metrics in parallel
    const [
      statusCounts,
      riskCounts,
      bankChangeStats,
      recentVendors,
    ] = await Promise.all([
      this.vendorRepo.countByStatus(tenantId),
      this.vendorRepo.countByRiskLevel(tenantId),
      this.getBankAccountStats(tenantId),
      this.vendorRepo.countRecentVendors(tenantId, 30), // Last 30 days
    ]);
    
    // Calculate derived metrics
    const pendingApproval = statusCounts.find(s => s.status === 'submitted')?.count ?? 0;
    const totalActive = statusCounts.find(s => s.status === 'approved')?.count ?? 0;
    const suspended = statusCounts.find(s => s.status === 'suspended')?.count ?? 0;
    const archived = statusCounts.find(s => s.status === 'archived')?.count ?? 0;
    
    const healthScore = calculateHealthScore({
      pendingApproval,
      pendingBankChanges: bankChangeStats.pendingChanges,
      duplicateFlagCount: bankChangeStats.duplicateFlags,
    });
    
    return {
      cellCode: 'AP-01',
      cellName: 'Vendor Master',
      
      healthScore,
      healthStatus: determineHealthStatus(healthScore),
      
      openItems: {
        total: pendingApproval + bankChangeStats.pendingChanges,
        pendingApproval,
        pendingBankChanges: bankChangeStats.pendingChanges,
      },
      
      vendorMetrics: {
        totalActiveVendors: totalActive,
        newVendorsThisMonth: recentVendors,
        suspendedVendors: suspended,
        archivedVendors: archived,
      },
      
      byRiskLevel: {
        high: riskCounts.find(r => r.riskLevel === 'HIGH')?.count ?? 0,
        medium: riskCounts.find(r => r.riskLevel === 'MEDIUM')?.count ?? 0,
        low: riskCounts.find(r => r.riskLevel === 'LOW')?.count ?? 0,
      },
      
      byStatus: statusCounts,
      
      bankAccountHealth: {
        changesLast30Days: bankChangeStats.changesLast30Days,
        changesAwaitingApproval: bankChangeStats.pendingChanges,
        duplicateFlagCount: bankChangeStats.duplicateFlags,
      },
      
      // SoD is 100% by design (enforced in DB)
      controlHealth: {
        sodComplianceRate: 100,
        dualControlCompliance: 100, // TODO: Calculate from bank changes
        auditCoverage: 100,
      },
      
      generatedAt: new Date(),
    };
  }

  /**
   * Get summary for AP Manager cluster dashboard
   */
  async getSummary(actor: ActorContext): Promise<VendorCellSummary> {
    const dashboard = await this.getDashboard(actor);
    
    return {
      code: 'AP-01',
      name: 'Vendor Master',
      healthScore: dashboard.healthScore,
      status: dashboard.healthStatus,
      openItems: dashboard.openItems.total,
      keyMetric: {
        label: 'Pending Approval',
        value: dashboard.openItems.pendingApproval,
      },
    };
  }

  /**
   * Get bank account statistics
   */
  private async getBankAccountStats(tenantId: string): Promise<{
    changesLast30Days: number;
    pendingChanges: number;
    duplicateFlags: number;
  }> {
    // These would come from the VendorRepositoryPort
    // For now, return defaults (to be implemented with actual repo methods)
    try {
      const [changesLast30Days, pendingChanges, duplicateFlags] = await Promise.all([
        this.vendorRepo.countBankChangesInPeriod?.(tenantId, 30) ?? Promise.resolve(0),
        this.vendorRepo.countPendingBankChanges?.(tenantId) ?? Promise.resolve(0),
        this.vendorRepo.countDuplicateBankFlags?.(tenantId) ?? Promise.resolve(0),
      ]);
      
      return { changesLast30Days, pendingChanges, duplicateFlags };
    } catch {
      // Fallback if methods not implemented yet
      return { changesLast30Days: 0, pendingChanges: 0, duplicateFlags: 0 };
    }
  }
}

// ============================================================================
// 4. FACTORY
// ============================================================================

export function createVendorDashboardService(
  vendorRepo: VendorRepositoryPort
): VendorDashboardService {
  return new VendorDashboardService(vendorRepo);
}
