/**
 * Invoice Dashboard API
 * 
 * GET /api/ap/invoices/dashboard
 * 
 * Returns AP-02 Invoice Entry cell dashboard metrics.
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock response until full integration
const MOCK_INVOICE_DASHBOARD = {
  cellCode: 'AP-02',
  cellName: 'Invoice Entry',
  
  healthScore: 82,
  healthStatus: 'warning',
  
  openItems: {
    total: 210,
    draft: 45,
    submitted: 165,
    awaitingMatch: 120,
  },
  
  volumeMetrics: {
    receivedToday: 23,
    receivedThisWeek: 95,
    receivedThisMonth: 387,
    avgDailyVolume: 18,
  },
  
  valueMetrics: {
    totalPendingValue: '1250000.00',
    avgInvoiceValue: '5952.38',
    currency: 'USD',
  },
  
  aging: {
    current: 150,
    days30to60: 35,
    days60to90: 18,
    over90Days: 7,
  },
  
  overdueMetrics: {
    overdueCount: 12,
    overdueValue: '45000.00',
    dueThisWeek: 28,
  },
  
  byStatus: [
    { status: 'draft', count: 45 },
    { status: 'submitted', count: 165 },
    { status: 'matched', count: 89 },
    { status: 'approved', count: 234 },
    { status: 'posted', count: 1250 },
    { status: 'paid', count: 890 },
  ],
  
  duplicateDetection: {
    blockedToday: 2,
    blockedThisMonth: 15,
    falsePositiveRate: 3.2,
  },
  
  periodCutoff: {
    currentPeriod: 'DEC-2025',
    periodCloseDate: '2025-12-31T23:59:59Z',
    daysUntilClose: 14,
    awaitingPosting: 165,
  },
  
  controlHealth: {
    sodComplianceRate: 100,
    periodComplianceRate: 100,
    auditCoverage: 100,
  },
  
  generatedAt: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(MOCK_INVOICE_DASHBOARD);
  } catch (error) {
    console.error('Failed to fetch invoice dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}
