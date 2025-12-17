/**
 * Canvas Pre-Flight API
 * 
 * GET /api/canvas/preflight - Get pre-flight status for current user
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock pre-flight status
const MOCK_PREFLIGHT = {
  requiresAcknowledgment: true,
  
  hardStops: [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      sourceRef: 'urn:aibos:ap:05:payment:a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      title: 'PAY-2024-0089',
      subtitle: 'GlobalTech Ltd - $125,000',
      tags: ['#URGENT', '#HIGH_VALUE'],
      priorityScore: 95,
      priorityReasons: ['Amount > $100K', '🚩 Flagged by Finance Manager'],
      createdAt: '2025-12-17T08:00:00Z',
      createdBy: { id: 'user-1', name: 'Alice Manager' },
      reactions: [
        { emoji: '🚩', count: 2 },
        { emoji: '👀', count: 1 },
      ],
    },
  ],
  
  softStops: [
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      sourceRef: 'urn:aibos:ap:02:invoice:b2c3d4e5-f6a7-8901-bcde-f23456789012',
      title: 'INV-2024-0201',
      subtitle: 'Office Supplies Inc - Overdue 5 days',
      tags: ['#OVERDUE'],
      priorityScore: 65,
      priorityReasons: ['Overdue 5 days', 'Amount $8,500'],
      createdAt: '2025-12-16T10:00:00Z',
      createdBy: { id: 'user-2', name: 'Bob Officer' },
      reactions: [],
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      sourceRef: 'urn:aibos:ap:02:invoice:c3d4e5f6-a7b8-9012-cdef-345678901234',
      title: 'INV-2024-0199',
      subtitle: 'Tech Partners - High Value',
      tags: ['#HIGH_VALUE'],
      priorityScore: 55,
      priorityReasons: ['Amount $45,000'],
      createdAt: '2025-12-16T09:00:00Z',
      createdBy: { id: 'user-2', name: 'Bob Officer' },
      reactions: [],
    },
  ],
  
  informational: [],
  
  totalUrgent: 3,
  highestPriority: 95,
  
  blockedRoutes: [
    {
      route: '/ap-manager/ap-05',
      reason: 'High-value payment requires acknowledgment',
      requiredAcknowledgments: ['550e8400-e29b-41d4-a716-446655440010'],
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    // In production: check session, query unacknowledged objects for user
    return NextResponse.json(MOCK_PREFLIGHT);
  } catch (error) {
    console.error('Failed to fetch pre-flight status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pre-flight status' },
      { status: 500 }
    );
  }
}
