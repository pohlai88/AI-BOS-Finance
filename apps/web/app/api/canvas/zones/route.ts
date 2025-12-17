/**
 * Canvas Zones API
 * 
 * GET /api/canvas/zones - List zones
 * POST /api/canvas/zones - Create zone
 */

import { NextRequest, NextResponse } from 'next/server';

// Default zones for AP Manager
const DEFAULT_ZONES = [
  {
    id: 'zone-inbox',
    tenantId: 'tenant-1',
    name: 'Inbox',
    zoneType: 'inbox',
    positionX: 0,
    positionY: 0,
    width: 300,
    height: 800,
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    triggerAction: 'none',
    triggerConfig: {},
    allowedRoles: ['officer', 'manager', 'admin'],
    displayOrder: 0,
    version: 1,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'zone-progress',
    tenantId: 'tenant-1',
    name: 'In Progress',
    zoneType: 'in_progress',
    positionX: 320,
    positionY: 0,
    width: 300,
    height: 800,
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    triggerAction: 'status_update',
    triggerConfig: { targetStatus: 'processing' },
    allowedRoles: ['officer', 'manager', 'admin'],
    displayOrder: 1,
    version: 1,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'zone-review',
    tenantId: 'tenant-1',
    name: 'Review',
    zoneType: 'review',
    positionX: 640,
    positionY: 0,
    width: 300,
    height: 800,
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    triggerAction: 'notify',
    triggerConfig: { notifyRoles: ['manager', 'approver'] },
    allowedRoles: ['officer', 'manager', 'admin'],
    displayOrder: 2,
    version: 1,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'zone-done',
    tenantId: 'tenant-1',
    name: 'Done',
    zoneType: 'done',
    positionX: 960,
    positionY: 0,
    width: 300,
    height: 800,
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    triggerAction: 'status_update',
    triggerConfig: { targetStatus: 'completed' },
    allowedRoles: ['officer', 'manager', 'admin'],
    displayOrder: 3,
    version: 1,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(DEFAULT_ZONES);
  } catch (error) {
    console.error('Failed to fetch canvas zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mock creation
    const newZone = {
      id: crypto.randomUUID(),
      ...body,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(newZone, { status: 201 });
  } catch (error) {
    console.error('Failed to create canvas zone:', error);
    return NextResponse.json(
      { error: 'Failed to create zone' },
      { status: 500 }
    );
  }
}
