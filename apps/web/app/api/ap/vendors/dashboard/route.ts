/**
 * Vendor Dashboard API
 * 
 * GET /api/ap/vendors/dashboard
 * 
 * Returns AP-01 Vendor Master cell dashboard metrics.
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock response until full integration
const MOCK_VENDOR_DASHBOARD = {
  cellCode: 'AP-01',
  cellName: 'Vendor Master',
  
  healthScore: 98,
  healthStatus: 'healthy',
  
  openItems: {
    total: 25,
    pendingApproval: 23,
    pendingBankChanges: 2,
  },
  
  vendorMetrics: {
    totalActiveVendors: 450,
    newVendorsThisMonth: 12,
    suspendedVendors: 3,
    archivedVendors: 45,
  },
  
  byRiskLevel: {
    high: 12,
    medium: 89,
    low: 349,
  },
  
  byStatus: [
    { status: 'draft', count: 8 },
    { status: 'submitted', count: 23 },
    { status: 'approved', count: 450 },
    { status: 'suspended', count: 3 },
    { status: 'archived', count: 45 },
  ],
  
  bankAccountHealth: {
    changesLast30Days: 8,
    changesAwaitingApproval: 2,
    duplicateFlagCount: 0,
  },
  
  controlHealth: {
    sodComplianceRate: 100,
    dualControlCompliance: 100,
    auditCoverage: 100,
  },
  
  generatedAt: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(MOCK_VENDOR_DASHBOARD);
  } catch (error) {
    console.error('Failed to fetch vendor dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}
