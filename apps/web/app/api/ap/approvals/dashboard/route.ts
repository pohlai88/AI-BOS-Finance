/**
 * Approval Dashboard API
 * 
 * GET /api/ap/approvals/dashboard
 * 
 * Returns AP-04 Invoice Approval cell dashboard metrics.
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock response until full integration
const MOCK_APPROVAL_DASHBOARD = {
  cellCode: 'AP-04',
  cellName: 'Invoice Approval',
  
  healthScore: 78,
  healthStatus: 'warning',
  
  openItems: {
    total: 92,
    pendingApproval: 92,
    pendingApprovalValue: '890000.00',
    currency: 'USD',
  },
  
  performanceMetrics: {
    approvedToday: 18,
    rejectedToday: 2,
    changesRequestedToday: 3,
    avgApprovalTimeDays: 1.8,
  },
  
  aging: {
    pending0to3Days: 45,
    pending3to7Days: 28,
    pending7to14Days: 14,
    pendingOver14Days: 5,
  },
  
  byLevel: [
    { level: 1, pendingCount: 52, avgWaitTimeDays: 1.2, bottleneckApprover: null },
    { level: 2, pendingCount: 28, avgWaitTimeDays: 2.1, bottleneckApprover: 'finance-mgr' },
    { level: 3, pendingCount: 12, avgWaitTimeDays: 3.5, bottleneckApprover: null },
  ],
  
  bottlenecks: [
    { approverId: 'user-1', approverName: 'Finance Manager', pendingCount: 28, avgResponseTimeDays: 2.8, status: 'slow' },
    { approverId: 'user-2', approverName: 'CFO', pendingCount: 8, avgResponseTimeDays: 4.2, status: 'slow' },
  ],
  
  sodCompliance: {
    totalApprovals: 1250,
    selfApprovalAttempts: 0,
    delegationUsage: 45,
    complianceRate: 100,
  },
  
  controlHealth: {
    sodComplianceRate: 100,
    timingComplianceRate: 95,
    auditCoverage: 100,
  },
  
  generatedAt: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(MOCK_APPROVAL_DASHBOARD);
  } catch (error) {
    console.error('Failed to fetch approval dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}
