/**
 * Match Dashboard API
 * 
 * GET /api/ap/match/dashboard
 * 
 * Returns AP-03 3-Way Match Engine cell dashboard metrics.
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock response until full integration
const MOCK_MATCH_DASHBOARD = {
  cellCode: 'AP-03',
  cellName: '3-Way Match',
  
  healthScore: 95,
  healthStatus: 'healthy',
  
  openItems: {
    total: 65,
    pendingMatch: 20,
    exceptions: 45,
  },
  
  matchPerformance: {
    passRate: 87.5,
    failRate: 5.2,
    exceptionRate: 7.3,
    matchedToday: 45,
    matchedThisWeek: 198,
  },
  
  byMatchMode: [
    { mode: 'NO_MATCH', count: 25, passRate: 100 },
    { mode: '1_WAY', count: 89, passRate: 95.2 },
    { mode: '2_WAY', count: 156, passRate: 91.3 },
    { mode: '3_WAY', count: 423, passRate: 84.1 },
  ],
  
  exceptionHealth: {
    totalOpen: 45,
    highSeverity: 3,
    mediumSeverity: 18,
    lowSeverity: 24,
    avgResolutionDays: 2.3,
    oldestUnresolvedDays: 12,
  },
  
  exceptionsByType: [
    { type: 'PRICE_VARIANCE', count: 18, avgAge: 3.2 },
    { type: 'QTY_VARIANCE', count: 12, avgAge: 2.1 },
    { type: 'NO_PO', count: 8, avgAge: 5.4 },
    { type: 'NO_GRN', count: 7, avgAge: 4.2 },
  ],
  
  overrideMetrics: {
    overridesThisMonth: 12,
    overrideValueTotal: '85000.00',
    currency: 'USD',
    topOverriders: [
      { userId: 'user-1', userName: 'John Smith', overrideCount: 5 },
      { userId: 'user-2', userName: 'Jane Doe', overrideCount: 4 },
    ],
  },
  
  controlHealth: {
    sodComplianceRate: 100,
    toleranceComplianceRate: 100,
    auditCoverage: 100,
  },
  
  generatedAt: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(MOCK_MATCH_DASHBOARD);
  } catch (error) {
    console.error('Failed to fetch match dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}
